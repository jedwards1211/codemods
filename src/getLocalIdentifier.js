const j = require('jscodeshift').withParser('babylon')

function getLocalIdentifier(root, imported, pkg) {
  return root
    .find(j.ImportDeclaration, { source: { value: 'sequelize' } })
    .find(j.ImportSpecifier, { imported: { name: imported } })
    .get('local', 'name').value
}

module.exports = getLocalIdentifier
