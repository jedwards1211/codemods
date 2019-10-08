const j = require('jscodeshift').withParser('babylon')
const { jscodeshiftTransform } = require('../morpher-utils')

exports.description =
  'converts Name/Value pairs in CF template environment variables to objects'
exports.onSelected = jscodeshiftTransform(({ root }) => {
  root
    .find(j.ObjectProperty, {
      key: { type: 'Identifier', name: 'Environment' },
      value: { type: 'ArrayExpression' },
    })
    .replaceWith(path => {
      const { elements } = path.node.value
      return j.objectProperty(
        j.identifier('Environment'),
        j.callExpression(j.identifier('cfEnvironment'), [
          j.objectExpression(
            elements.map(e => {
              if (e.type !== 'ObjectExpression') return null
              const nameProp = e.properties.find(p => p.key.name === 'Name')
              const valueProp = e.properties.find(p => p.key.name === 'Value')
              if (!nameProp || !valueProp) return null
              return j.objectProperty(
                j.identifier(nameProp.value.value),
                valueProp.value
              )
            })
          ),
        ])
      )
    })
})
