const j = require('jscodeshift').withParser('babylon')

function getImportedSpecifiers(root, kind, pkg) {
  return root.find(j.ImportDeclaration, {
    importKind: kind, source: {value: pkg}}
  ).find(j.ImportSpecifier).nodes().map(node => node.imported.name)
}

module.exports = getImportedSpecifiers
