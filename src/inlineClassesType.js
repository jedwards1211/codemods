module.exports = function inlineClassesType(fileInfo, api) {
  const j = api.jscodeshift
  const { statement } = j.template
  const root = j(fileInfo.source)

  const classesSpecifier = root
    .find(j.ImportDeclaration, {
      source: { value: "material-ui-render-props-styles" }
    })
    .find(j.ImportSpecifier, { imported: { name: "Classes" } })
    .at(0)

  if (!classesSpecifier.size()) return

  const localName = classesSpecifier.nodes()[0].local.name

  const usages = root.find(j.GenericTypeAnnotation, {
    id: { name: localName },
    typeParameters: { params: [{ type: "TypeofTypeAnnotation", argument: {type: 'GenericTypeAnnotation'} }] }
  })

  const objectUsages = usages
    .filter(path => {
      const {node, scope} = path
      if (!scope) return false
      const {typeParameters: {params: [{argument: {id: {name}}}]}} = node
      const binding = scope.lookup(name)
      if (!binding) return false
      const declarator = j(binding.getBindings()[name]).closest(j.VariableDeclarator)
      if (!declarator.size()) return false
      return declarator.nodes()[0].init.type === 'ObjectExpression'
    })
  const functionUsages = usages
    .filter(path => {
      const {node, scope} = path
      if (!scope) return false
      const {typeParameters: {params: [{argument: {id: {name}}}]}} = node
      const binding = scope.lookup(name)
      if (!binding) return false
      const declarator = j(binding.getBindings()[name]).closest(j.VariableDeclarator)
      if (!declarator.size()) return false
      return declarator.nodes()[0].init.type === 'ArrowFunctionExpression'
    })

  const importDecl = classesSpecifier.closest(j.ImportDeclaration)

  const specifiers = importDecl.find(j.ImportSpecifier)

  const fnName = functionUsages.size() && objectUsages.size()
    ? `Fn${localName}`
    : localName
  const objName = functionUsages.size() & objectUsages.size()
    ? `Obj${localName}`
    : localName

  const comments = importDecl.nodes()[0].comments

  if (functionUsages.size()) {
    const inlineClasses = statement([`type ${fnName}<Styles> = $Call<
  <T>((any) => T) => { [$Keys<T>]: string },
  Styles
>
`])
    if (!objectUsages.size() && specifiers.size() === 1 && comments) {
      inlineClasses.comments = [...comments]
    }
    importDecl.insertAfter(inlineClasses)
    if (fnName !== localName) {
      functionUsages.nodes().forEach(node => {
        node.id.name = fnName
      })
    }
  }
  if (objectUsages.size()) {
    const inlineSimpleClasses = statement([`type ${objName}<Styles> = { [$Keys<Styles>]: string }

`])
    if (specifiers.size() === 1 && comments) {
      inlineSimpleClasses.comments = [...comments]
    }
    importDecl.insertAfter(inlineSimpleClasses)
    if (objName !== localName) {
      objectUsages.nodes().forEach(node => {
        node.id.name = objName
      })
    }
  }

  if (importDecl.find(j.ImportSpecifier).size() === 1) importDecl.remove()
  else classesSpecifier.remove()

  return root.toSource()
}

module.exports.parser = "babylon"
