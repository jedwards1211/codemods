const subpathRx = /^lodash\/(.+)$/

module.exports = function switchToSpecifiedLodashImports(fileInfo, api) {
  const j = api.jscodeshift
  const root = api.jscodeshift(fileInfo.source)
  const lodashImports = root.find(j.ImportDeclaration, {
    specifiers: [{ type: 'ImportDefaultSpecifier' }],
    source: { value: value => subpathRx.test(value) },
  })
  const specifiers = []
  lodashImports.forEach(path => {
    const match = subpathRx.exec(path.value.source.value)
    specifiers.push(
      j.importSpecifier(
        j.identifier(match[1]),
        j.identifier(path.value.specifiers[0].local.name)
      )
    )
  })
  if (specifiers.length) {
    lodashImports
      .at(0)
      .replaceWith(j.importDeclaration(specifiers, j.literal('lodash')))
    for (let i = 1; i < lodashImports.size(); i++) {
      lodashImports.at(i).remove()
    }
  }
  return root.toSource()
}

module.exports.parser = 'babylon'
