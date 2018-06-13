import j from 'jscodeshift'

function explodeImports(root, pkg) {
  root.find(j.ImportDeclaration, {source: {value: pkg}}).replaceWith(path => {
    const {node} = path
    return node.specifiers.map(specifier => {
      if (specifier.type === 'ImportDefaultSpecifier') {
        return j.importDeclaration([specifier], node.source, node.importKind)
      }
      return j.importDeclaration([specifier], j.stringLiteral(`${pkg}/${specifier.imported.name}`))
    })
  })
  return root
}

module.exports = explodeImports
