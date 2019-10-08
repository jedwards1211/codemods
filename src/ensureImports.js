const j = require('jscodeshift').withParser('babylon')
const getImportedSpecifiers = require('./getImportedSpecifiers')
const addImportDeclaration = require('./addImportDeclaration')

function ensureImports(root, kind, specifiers, pkg) {
  const importedSpecifiers = getImportedSpecifiers(root, kind, pkg)
  const missing = specifiers.filter(
    name => importedSpecifiers.indexOf(name) < 0
  )
  if (missing.length) {
    const existing = root.find(j.ImportDeclaration, {
      importKind: kind,
      source: { value: pkg },
    })
    if (existing.length) {
      const targetImport = existing.at(existing.length - 1)
      const specifiers = targetImport.find(j.ImportSpecifier)
      const lastSpecifier = specifiers.at(specifiers.length - 1)
      missing.forEach(imported =>
        lastSpecifier.insertAfter(j.importSpecifier(j.identifier(imported)))
      )
    } else {
      addImportDeclaration(
        root,
        j.importDeclaration(
          missing.map(imported => j.importSpecifier(j.identifier(imported))),
          j.literal(pkg),
          kind
        )
      )
    }
  }
}

module.exports = ensureImports
