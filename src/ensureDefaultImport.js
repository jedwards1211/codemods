const j = require('jscodeshift').withParser('babylon')
const addImportDeclaration = require('./addImportDeclaration')

function ensureDefaultImport(root, kind, as, pkg) {
  const existing = root
    .find(j.ImportDeclaration, {
      importKind: kind,
      source: { value: pkg },
      specifiers: [{ local: { name: as } }],
    })
    .find(j.ImportDefaultSpecifier)
  if (existing.length) return
  addImportDeclaration(
    root,
    j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier(as))],
      j.literal(pkg),
      kind
    )
  )
}

module.exports = ensureDefaultImport
