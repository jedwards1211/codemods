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
  schema,
  schemaFile,
  server,
  exploded,
}) {
  if (schemaFile && !schema) schema = await loadSchema(schemaFile)

  const document = typeof query === 'string'
    ? query = graphql.parse(query)
    : query
  const types = await getSchemaTypes({schema, server})

  const fragments = new Map()
  const result = []

  function convertDefinition(def) {
    switch (def.kind) {
    case 'OperationDefinition': return convertOperationDefinition(def)
    case 'FragmentDefinition': return convertFragmentDefinition(def)
    }
  }

  function convertFragmentDefinition(def) {
    const type = convertSelectionSet(def.selectionSet, types[def.typeCondition.name.value])
    fragments.set(def.name.value, type)
    if (exploded) addObjectTypeAlias(`${def.name.value}Data`, type)
  }

  function convertOperationDefinition(def) {
    const {operation, selectionSet, variableDefinitions} = def
    const name = def.name ? def.name.value : `Unnamed${upperFirst(operation)}`
    if (variableDefinitions && variableDefinitions.length) {
      addObjectTypeAlias(
        `${name}Variables`,
        convertVariableDefinitions(variableDefinitions)
      )
    }
    addObjectTypeAlias(
      `${name}Data`,
      convertSelectionSet(selectionSet, types[upperFirst(operation)])
    )
    if (operation === 'mutation') {
      result.push(statement([`type ${name}Mutate = (options: {
  variables: ${name}Variables,
}) => Promise<${name}Data>`]))
    }
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
    if (exploded) {
      return j.objectTypeSpreadProperty(j.genericTypeAnnotation(j.identifier(`${spread.name.value}Data`), null))
    } else {
      const fragment = fragments.get(spread.name.value)
      if (!fragment) throw new Error('missing fragment definition named `${spread.name.value}`')
      return fragment.properties
    }
  }

  const objectTypeCounts = {}

  function addObjectTypeAlias(name, properties) {
    let count = objectTypeCounts[name]
    if (count != null) {
      objectTypeCounts[name] = ++count
      name += count
    } else {
      objectTypeCounts[name] = 0
    }
    const alias = j.typeAlias(
      j.identifier(name),
      null,
      properties
    )
    result.push(alias)
    return alias
  }

  function convertField(field, type) {
    let {name, alias, selectionSet} = field
    let typeValue
    if (name.value === '__typename') typeValue = j.stringTypeAnnotation()
    else if (selectionSet) {
      const fieldType = type.fields[name.value].type
      let innerType = fieldType
      while (innerType.ofType) innerType = innerType.ofType
      if (exploded) {
        addObjectTypeAlias(`${innerType.name}Data`, convertSelectionSet(selectionSet, innerType))
        typeValue = convertType(fieldType)
      } else {
        typeValue = convertType(fieldType, selectionSet)
      }
    } else {
      typeValue = convertType(type.fields[name.value].type)
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
    if (type.kind === 'ENUM') return j.unionTypeAnnotation(type.enumValues.map(
      value => j.stringLiteralTypeAnnotation(value.name, value.name)
    ))
    const {name} = type
    switch (name) {
    case 'Boolean': return j.booleanTypeAnnotation()
    case 'Int':
    case 'Float': return j.numberTypeAnnotation()
    case 'ID':
    case 'String': return j.stringTypeAnnotation()
    case 'JSON': return j.genericTypeAnnotation(j.identifier('Object'), null)
    }
    if (types[name]) type = types[name]
    if (type.inputFields) return convertInputType(type)
    if (exploded) {
      let name = `${type.name}Data`
      const count = objectTypeCounts[name]
      if (count > 0) name += count
      return j.genericTypeAnnotation(j.identifier(name), null)
    } else if (selectionSet) {
      return convertSelectionSet(selectionSet, type)
    } else {
      return j.anyTypeAnnotation()
    }
  }

  function convertListType(type, selectionSet) {
    return j.genericTypeAnnotation(
      j.identifier('Array'),
      j.typeParameterInstantiation([innerConvertType(type.ofType, selectionSet)])
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

  let otherDefinitions = []
  // convert fragments first
  for (let def of document.definitions) {
    if (def.kind === 'FragmentDefinition') convertFragmentDefinition(def)
    else otherDefinitions.push(def)
  }
  for (let def of otherDefinitions) convertDefinition(def)

  return result
}
