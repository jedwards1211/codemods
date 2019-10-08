const j = require('jscodeshift').withParser('babylon')

function getInitAssociationsDeclaration(modelClass) {
  return modelClass.find(j.ClassMethod, {
    key: { name: 'initAssociations' },
    static: true,
  })
}

module.exports = getInitAssociationsDeclaration
