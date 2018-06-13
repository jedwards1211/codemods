const j = require('jscodeshift').withParser('babylon')

function addImportDeclaration(root, decl) {
  const imports = root.find(j.ImportDeclaration)
  if (!imports.length) {
    const body = root.find(j.Program).get('body').value
    body.push(decl)
  } else {
    const lastImport = imports.at(imports.length - 1)
    lastImport.insertAfter(decl)
  }
}

module.exports = addImportDeclaration
