const j = require('jscodeshift').withParser('babylon')
const addImportDeclaration = require('./addImportDeclaration')

function ensureImport(root, kind, name, pkg) {
  const imports = root.find(j.ImportDeclaration, {
    importKind: kind,
    source: { value: pkg },
  })
  let existing = imports.find(j.ImportSpecifier, { imported: { name } })
  if (name === 'default' && !existing.length) {
    existing = imports.find(j.ImportDefaultSpecifier)
  }
  if (existing.length) return imports.at(0).node.local.name

  const newSpecifier = j.importSpecifier(j.identifier(name))

  if (imports.length) {
    const targetImport = imports.at(imports.length - 1)
    const specifiers = targetImport.find(j.ImportSpecifier)
    const lastSpecifier = specifiers.at(specifiers.length - 1)
    lastSpecifier.insertAfter(newSpecifier)
  } else {
    addImportDeclaration(
      root,
      j.importDeclaration([newSpecifier], j.literal(pkg), kind)
    )
  }

  return name
}

module.exports = ensureImport
