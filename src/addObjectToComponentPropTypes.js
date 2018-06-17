module.exports = function addObjectToComponentPropsTypes(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const {expression} = j.template
  const propTypesImport = root.find(j.ImportDeclaration, {
    source: {value: 'prop-types'},
  }).find(j.ImportDefaultSpecifier)
  if (!propTypesImport.nodes().length) return
  const propTypesIdentifier = propTypesImport.nodes()[0].local.name

  const componentPropTypes = root.find(j.ObjectProperty, node =>
    /component$/i.test(node.key.name) &&
    node.value.type === 'CallExpression' &&
    node.value.callee.type === 'MemberExpression' &&
    node.value.callee.object.name === propTypesIdentifier &&
    node.value.callee.property.name === 'oneOfType' &&
    node.value.arguments.length &&
    node.value.arguments[0].type === 'ArrayExpression' &&
    node.value.arguments[0].elements.findIndex(arg =>
      arg.type === 'MemberExpression' &&
      arg.object.name === propTypesIdentifier &&
      arg.property.name === 'string'
    ) >= 0 &&
    node.value.arguments[0].elements.findIndex(arg =>
      arg.type === 'MemberExpression' &&
      arg.object.name === propTypesIdentifier &&
      arg.property.name === 'func'
    ) >= 0 &&
    node.value.arguments[0].elements.findIndex(arg =>
      arg.type === 'MemberExpression' &&
      arg.object.name === propTypesIdentifier &&
      arg.property.name === 'object'
    ) < 0
  )
  componentPropTypes.find(j.CallExpression).replaceWith(
    expression`${propTypesIdentifier}.oneOfType([${propTypesIdentifier}.string, ${propTypesIdentifier}.func, ${propTypesIdentifier}.object])`
  )

  return root.toSource()
}
