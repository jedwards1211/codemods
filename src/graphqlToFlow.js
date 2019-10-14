const j = require('jscodeshift').withParser('babylon')
const graphql = require('graphql')
const getSchemaTypes = require('./getSchemaTypes')
const map = require('lodash/map')
const upperFirst = require('lodash/upperFirst')
const fs = require('fs-extra')

const schemaCache = new Map()
const schemaFileTimestamps = new Map()

const { statement } = j.template

async function loadSchema(file) {
  const timestamp = schemaFileTimestamps.get(file)
  if (timestamp != null) {
    const latest = (await fs.stat(file)).mtime
    if (latest > timestamp) {
      schemaFileTimestamps.set(file, latest)
      schemaCache.delete(file)
    } else {
      return schemaCache.get(file)
    }
  }
  const schema = graphql.buildSchema(await fs.readFile(file, 'utf8'))
  schemaCache.set(file, schema)
  return schema
}

module.exports = async function graphqlToFlow({
  query,
  file,
  schema,
  schemaFile,
  server,
  ApolloQueryResult = 'ApolloQueryResult',
  MutationFunction = 'MutationFunction',
  extractTypes = new Set(),
  scalarAliases = new Map(),
}) {
  if (schemaFile && !schema) schema = await loadSchema(schemaFile)
  for (const [key, value] of scalarAliases.entries()) {
    const converted = j(`// @flow
type __T = ${value};`)
      .find(j.TypeAlias)
      .nodes()[0].right
    scalarAliases.set(key, converted)
  }

  const strippedFileName = file
    ? require('path')
        .basename(file)
        .replace(/\..+$/, '')
    : null

  const document =
    typeof query === 'string' ? (query = graphql.parse(query)) : query
  const types = await getSchemaTypes({ schema, server })

  const fragments = new Map()
  const statements = []
  const generatedTypes = {
    query: {},
    mutation: {},
    subscription: {},
  }

  function convertDefinition(def) {
    switch (def.kind) {
      case 'OperationDefinition':
        return convertOperationDefinition(def)
      case 'FragmentDefinition':
        return convertFragmentDefinition(def)
    }
  }

  function convertFragmentDefinition(def) {
    const type = convertSelectionSet(
      def.selectionSet,
      types[def.typeCondition.name.value]
    )
    const alias = addTypeAlias(`${upperFirst(def.name.value)}Data`, type)
    fragments.set(def.name.value, alias)
  }

  function convertOperationDefinition(def) {
    const { operation, selectionSet, variableDefinitions } = def
    let name = def.name ? upperFirst(def.name.value) : `Unnamed`
    if (
      strippedFileName &&
      name.toLowerCase().startsWith(strippedFileName.toLowerCase())
    ) {
      name = name.substring(strippedFileName.length)
    }
    if (name.toLowerCase().lastIndexOf(operation) < 0) {
      name += upperFirst(operation)
    }
    const operationTypes = def.name
      ? (generatedTypes[operation][def.name.value] = {})
      : {}
    if (variableDefinitions && variableDefinitions.length) {
      operationTypes.variables = addTypeAlias(
        `${name}Variables`,
        convertVariableDefinitions(variableDefinitions)
      )
    }
    operationTypes.data = addTypeAlias(
      `${name}Data`,
      convertSelectionSet(selectionSet, types[upperFirst(operation)])
    )
    if (operation === 'mutation') {
      statements.push(
        (operationTypes.mutationFunction = statement([
          `type ${name}Function = ${MutationFunction}<${
            operationTypes.data.id.name
          }${
            operationTypes.variables
              ? `, ${operationTypes.variables.id.name}`
              : ''
          }>`,
        ]))
      )
    }
  }

  const typeAliasCounts = {}

  function addTypeAlias(name, type) {
    let count = typeAliasCounts[name]
    if (count != null) {
      typeAliasCounts[name] = ++count
      name += count
    } else {
      typeAliasCounts[name] = 0
    }
    const alias = j.typeAlias(j.identifier(name), null, type)
    statements.push(alias)
    return alias
  }

  function convertVariableDefinitions(variableDefinitions) {
    const props = [].concat(
      ...variableDefinitions.map(def => convertVariableDefinition(def))
    )
    return j.objectTypeAnnotation(props)
  }

  function convertVariableDefinition(def) {
    const {
      variable: { name },
      type,
    } = def
    return j.objectTypeProperty(
      j.identifier(name.value),
      convertVariableType(type),
      type.kind !== 'NonNullType'
    )
  }

  function convertVariableType(type) {
    if (type.kind === 'NonNullType') return innerConvertVariableType(type.type)
    return j.nullableTypeAnnotation(innerConvertVariableType(type))
  }

  function innerConvertVariableType(type) {
    switch (type.kind) {
      case 'NamedType':
        return convertVariableTypeName(type.name.value)
      case 'ListType':
        return j.genericTypeAnnotation(
          j.identifier('Array'),
          j.typeParameterInstantiation([convertVariableType(type.type)])
        )
    }
  }

  function convertVariableTypeName(name) {
    switch (name) {
      case 'Boolean':
        return j.booleanTypeAnnotation()
      case 'Int':
      case 'Float':
        return j.numberTypeAnnotation()
      case 'ID':
      case 'String':
        return j.stringTypeAnnotation()
    }
    const type = types[name]
    if (type && type.inputFields) return convertInputType(type)
    return scalarAliases.get(name) || j.mixedTypeAnnotation()
  }

  function convertSelectionSet(selectionSet, type) {
    const { selections } = selectionSet
    const propSelections = selections.filter(s => s.kind === 'Field')
    const fragmentSelections = selections.filter(
      s => s.kind === 'FragmentSpread'
    )
    const intersects = []
    if (propSelections.length) {
      intersects.push(
        j.objectTypeAnnotation(propSelections.map(s => convertField(s, type)))
      )
    }
    fragmentSelections.forEach(spread => {
      const alias = fragments.get(spread.name.value)
      if (!alias)
        throw new Error(
          `missing fragment definition named ${spread.name.value}`
        )
      intersects.push(j.genericTypeAnnotation(alias.id, null))
    })
    return intersects.length === 1
      ? intersects[0]
      : j.intersectionTypeAnnotation(intersects)
  }

  function getInnerType(type) {
    let innerType = type
    while (innerType.ofType) innerType = innerType.ofType
    return innerType
  }

  function getFieldType(objectType, fieldName) {
    const innerType = getInnerType(objectType)
    const fieldDef = innerType.fields[fieldName]
    if (!fieldDef)
      throw new Error(
        `type ${innerType.name} doesn't have a field named ${fieldName}`
      )
    return fieldDef.type
  }

  function convertField(field, type) {
    let { name, alias, selectionSet, directives } = field
    let typeValue
    const fieldName = name.value
    if (fieldName === '__typename') typeValue = j.stringTypeAnnotation()
    else typeValue = convertType(getFieldType(type, fieldName), selectionSet)
    if (directives) {
      for (let directive of directives) {
        const {
          name: { value: name },
        } = directive
        if (name === 'include' || name === 'skip') {
          if (typeValue.type !== 'NullableTypeAnnotation') {
            typeValue = j.nullableTypeAnnotation(typeValue)
          }
          break
        }
      }
    }
    return j.objectTypeProperty(
      j.identifier((alias || name).value),
      typeValue,
      false
    )
  }

  function convertType(type, selectionSet) {
    if (type.kind === 'NON_NULL')
      return innerConvertType(type.ofType, selectionSet)
    return j.nullableTypeAnnotation(innerConvertType(type, selectionSet))
  }

  function innerConvertType(type, selectionSet) {
    if (type.kind === 'LIST') return convertListType(type, selectionSet)
    const { name } = type
    function extractIfNecessary(result) {
      if (extractTypes.has(name)) {
        const alias = addTypeAlias(name, result)
        return j.genericTypeAnnotation(j.identifier(alias.id.name), null)
      }
      return result
    }
    if (type.kind === 'ENUM')
      return extractIfNecessary(
        j.unionTypeAnnotation(
          type.enumValues.map(value =>
            j.stringLiteralTypeAnnotation(value.name, value.name)
          )
        )
      )
    switch (name) {
      case 'Boolean':
        return j.booleanTypeAnnotation()
      case 'Int':
      case 'Float':
        return j.numberTypeAnnotation()
      case 'ID':
      case 'String':
        return j.stringTypeAnnotation()
    }
    function convertCustomType(type, selectionSet) {
      if (types[name]) type = types[name]
      if (type.inputFields) return convertInputType(type)
      if (selectionSet) {
        return convertSelectionSet(selectionSet, type)
      } else {
        return scalarAliases.get(name) || j.mixedTypeAnnotation()
      }
    }
    return extractIfNecessary(convertCustomType(type, selectionSet))
  }

  function convertListType(type, selectionSet) {
    return j.genericTypeAnnotation(
      j.identifier('Array'),
      j.typeParameterInstantiation([convertType(type.ofType, selectionSet)])
    )
  }

  function convertInputType(type) {
    return j.objectTypeAnnotation(
      map(type.inputFields, field => convertInputField(field))
    )
  }

  function convertInputField(field) {
    return j.objectTypeProperty(
      j.identifier(field.name),
      convertType(field.type),
      field.type.kind !== 'NON_NULL'
    )
  }

  // convert fragments first
  for (let def of document.definitions) {
    if (def.kind === 'FragmentDefinition') convertFragmentDefinition(def)
  }
  for (let def of document.definitions) {
    if (def.kind !== 'FragmentDefinition') convertDefinition(def)
  }

  return { statements, generatedTypes }
}
