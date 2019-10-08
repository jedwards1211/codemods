const j = require('jscodeshift').withParser('babylon')
const getLocalIdentifier = require('./getLocalIdentifier')

function getModelClassDeclaration(root) {
  const modelIdentifier = getLocalIdentifier(root, 'Model', 'sequelize')
  return root.find(j.ClassDeclaration, {
    superClass: { name: modelIdentifier },
  })
}

module.exports = getModelClassDeclaration
