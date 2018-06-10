const j = require('jscodeshift').withParser('babylon')

function addImportDeclaration(root, decl) {
  const imports = root.find(j.ImportDeclaration)
  const lastImport = imports.at(imports.length - 1)
  lastImport.insertAfter(decl)
}

module.exports = addImportDeclaration
