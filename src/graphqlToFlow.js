const j = require('jscodeshift')
const graphql = require('graphql')
const getSchemaTypes = require('./getSchemaTypes')

module.exports = async function graphqlToFlow({
  query,
  server,
}) {
  const document = typeof query === 'string'
    ? query = graphql.parse(query)
    : query
  const types = await getSchemaTypes(server)

  const result = []

  function convertDefinition(def) {
    switch (def.kind) {
    case 'OperationDefinition': return convertOperationDefinition(def)
    case 'FragmentDefinition': return convertFragmentDefinition(def)
    }
  }

  function convertFragmentDefinition(def) {
    addObjectTypeAlias(
      `${def.name.value}Data`,
      convertSelectionSet(def.selectionSet, types[def.typeCondition.name.value])
    )
  }

  function convertOperationDefinition(def) {
    switch (def.operation) {
    case 'query': convertQueryDefinition(def)
    }
  }

  function convertQueryDefinition(def) {
    addObjectTypeAlias(
      `${def.name ? def.name.value : 'UnnamedQuery'}Data`,
      convertSelectionSet(def.selectionSet, types.Query)
    )
  }

  function convertSelectionSet(selectionSet, type) {
    return j.objectTypeAnnotation(selectionSet.selections.map(selection => convertSelection(selection, type)))
  }

  function convertSelection(selection, type) {
    switch (selection.kind) {
    case 'Field': return convertField(selection, type)
    case 'FragmentSpread': return convertFragmentSpread(selection, type)
    }
  }

  function convertFragmentSpread(spread, type) {
    return j.objectTypeSpreadProperty(j.genericTypeAnnotation(j.identifier(`${spread.name.value}Data`), null))
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
      let innerType = type.fields[name.value].type
      while (innerType.ofType) innerType = innerType.ofType
      addObjectTypeAlias(`${innerType.name}Data`, convertSelectionSet(selectionSet, innerType))
      typeValue = convertType(type.fields[name.value].type)
    } else {
      typeValue = convertType(type.fields[name.value].type)
    }
    return j.objectTypeProperty(
      j.identifier((alias || name).value),
      typeValue,
      false
    )
  }

  function convertType(type) {
    if (type.kind === 'NON_NULL') return innerConvertType(type.ofType)
    return j.nullableTypeAnnotation(innerConvertType(type))
  }

  function innerConvertType(type) {
    if (type.kind === 'LIST') return j.genericTypeAnnotation(
      j.identifier('Array'),
      j.typeParameterInstantiation([innerConvertType(type.ofType)])
    )
    switch (type.name) {
    case 'Boolean': return j.booleanTypeAnnotation()
    case 'Int':
    case 'Float': return j.numberTypeAnnotation()
    case 'String': return j.stringTypeAnnotation()
    case 'JSON': return j.genericTypeAnnotation(j.identifier('Object'), null)
    }
    let name = `${type.name}Data`
    const count = objectTypeCounts[name]
    if (count > 0) name += count
    return j.genericTypeAnnotation(j.identifier(name), null)
  }

  for (let def of document.definitions) {
    convertDefinition(def)
  }

  return result
}
