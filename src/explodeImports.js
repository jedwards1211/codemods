import j from 'jscodeshift'

function explodeImports(root, pkg) {
  root
    .find(j.ImportDeclaration, { source: { value: pkg } })
    .replaceWith(path => {
      const { node } = path
      return node.specifiers.map(specifier => {
        if (specifier.type === 'ImportDefaultSpecifier') {
          return j.importDeclaration([specifier], node.source, node.importKind)
        }
        const result = j.importDeclaration(
          [j.importDefaultSpecifier(specifier.local)],
          j.stringLiteral(`${pkg}/${specifier.imported.name}`, node.importKind)
        )
        // for some reason the importKind doesn't always get set by the factory
        if (node.importKind) result.importKind = node.importKind
        return result
      })
    })
  return root
}

module.exports = explodeImports
