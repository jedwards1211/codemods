const j = require('jscodeshift').withParser('babylon')
const graphql = require('graphql')
const getSchemaTypes = require('./getSchemaTypes')
const map = require('lodash/map')
const upperFirst = require('lodash/upperFirst')
const fs = require('fs-extra')

const schemaCache = new Map()
const schemaFileTimestamps = new Map()

const {statement} = j.template

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
}) {
  if (schemaFile && !schema) schema = await loadSchema(schemaFile)

  const strippedFileName = file
    ? require('path').basename(file).replace(/\..+$/, '')
    : null

  const document = typeof query === 'string'
    ? query = graphql.parse(query)
    : query
  const types = await getSchemaTypes({schema, server})

  const fragments = new Map()
  const statements = []
  const generatedTypes = {
    query: {},
    mutation: {},
    subscription: {},
  }

  function convertDefinition(def) {
    switch (def.kind) {
    case 'OperationDefinition': return convertOperationDefinition(def)
    case 'FragmentDefinition': return convertFragmentDefinition(def)
    }
  }

  function convertFragmentDefinition(def) {
    const type = convertSelectionSet(def.selectionSet, types[def.typeCondition.name.value])
    const alias = addTypeAlias(`${upperFirst(def.name.value)}Data`, type)
    fragments.set(def.name.value, alias)
  }

  function convertOperationDefinition(def) {
    const {operation, selectionSet, variableDefinitions} = def
    let name = def.name ? upperFirst(def.name.value) : `Unnamed`
    if (strippedFileName && name.toLowerCase().startsWith(strippedFileName.toLowerCase())) {
      name = name.substring(strippedFileName.length)
    }
    if (name.toLowerCase().lastIndexOf(operation) < 0) {
      name += upperFirst(operation)
    }
    const operationTypes = def.name
      ? generatedTypes[operation][def.name.value] = {}
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
      statements.push(operationTypes.mutationFunction = statement([
        `type ${name}Function = ${MutationFunction}<${operationTypes.data.id.name}${operationTypes.variables ? `, ${operationTypes.variables.id.name}` : ''}>`
      ]))
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
    const alias = j.typeAlias(
      j.identifier(name),
      null,
      type
    )
    statements.push(alias)
    return alias
  }

  function convertVariableDefinitions(variableDefinitions) {
    const props = [].concat(...variableDefinitions.map(def => convertVariableDefinition(def)))
    return j.objectTypeAnnotation(props)
  }

  function convertVariableDefinition(def) {
    const {variable: {name}, type} = def
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
    case 'NamedType': return convertVariableTypeName(type.name.value)
    case 'ListType': return j.genericTypeAnnotation(
      j.identifier('Array'),
      j.typeParameterInstantiation([convertVariableType(type.type)])
    )
    }
  }

  function convertVariableTypeName(name) {
    switch (name) {
    case 'Boolean': return j.booleanTypeAnnotation()
    case 'Int':
    case 'Float': return j.numberTypeAnnotation()
    case 'ID':
    case 'String': return j.stringTypeAnnotation()
    case 'JSON': return j.genericTypeAnnotation(j.identifier('Object'), null)
    }
    const type = types[name]
    if (type && type.inputFields) return convertInputType(type)
    return j.anyTypeAnnotation()
  }

  function convertSelectionSet(selectionSet, type) {
    const props = [].concat(...selectionSet.selections.map(selection => convertSelection(selection, type)))
    return j.objectTypeAnnotation(props)
  }

  function convertSelection(selection, type) {
    switch (selection.kind) {
    case 'Field': return convertField(selection, type)
    case 'FragmentSpread': return convertFragmentSpread(selection, type)
    }
  }

  function convertFragmentSpread(spread, type) {
    const alias = fragments.get(spread.name.value)
    if (!alias) throw new Error(`missing fragment definition named ${spread.name.value}`)
    return j.objectTypeSpreadProperty(j.genericTypeAnnotation(j.identifier(alias.id.name), null))
  }

  function getInnerType(type) {
    let innerType = type
    while (innerType.ofType) innerType = innerType.ofType
    return innerType
  }

  function convertField(field, type) {
    let {name, alias, selectionSet} = field
    let typeValue
    if (name.value === '__typename') typeValue = j.stringTypeAnnotation()
    else if (selectionSet) {
      const innerType = getInnerType(type)
      const fieldType = innerType.fields[name.value].type
      typeValue = convertType(fieldType, selectionSet)
    } else {
      const innerType = getInnerType(type)
      typeValue = convertType(innerType.fields[name.value].type)
    }
    return j.objectTypeProperty(
      j.identifier((alias || name).value),
      typeValue,
      false
    )
  }

  function convertType(type, selectionSet) {
    if (type.kind === 'NON_NULL') return innerConvertType(type.ofType, selectionSet)
    return j.nullableTypeAnnotation(innerConvertType(type, selectionSet))
  }

  function innerConvertType(type, selectionSet) {
    if (type.kind === 'LIST') return convertListType(type, selectionSet)
    const {name} = type
    function extractIfNecessary(result) {
      if (extractTypes.has(name)) {
        const alias = addTypeAlias(name, result)
        return j.genericTypeAnnotation(j.identifier(alias.id.name), null)
      }
      return result
    }
    if (type.kind === 'ENUM') return extractIfNecessary(
      j.unionTypeAnnotation(type.enumValues.map(
        value => j.stringLiteralTypeAnnotation(value.name, value.name)
      ))
    )
    switch (name) {
    case 'Boolean': return j.booleanTypeAnnotation()
    case 'Int':
    case 'Float': return j.numberTypeAnnotation()
    case 'ID':
    case 'String': return j.stringTypeAnnotation()
    case 'JSON': return j.genericTypeAnnotation(j.identifier('Object'), null)
    }
    function convertCustomType(type, selectionSet) {
      if (types[name]) type = types[name]
      if (type.inputFields) return convertInputType(type)
      if (selectionSet) {
        return convertSelectionSet(selectionSet, type)
      } else {
        return j.anyTypeAnnotation()
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
    return j.objectTypeAnnotation(map(type.inputFields, field => convertInputField(field)))
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

  return {statements, generatedTypes}
}
