const j = require('jscodeshift')

function convertStringPropToTemplate(root, filter = () => true) {
  root.find(j.JSXAttribute, {value: {type: 'StringLiteral'}})
    .find(j.StringLiteral).filter(filter).replaceWith(path => {
      return j.jsxExpressionContainer(
        j.templateLiteral([
          j.templateElement(
            {
              raw: path.node.value,
              cooked: path.node.value,
            },
            true
          ),
        ], [])
      )
    })
  return root
}

module.exports = convertStringPropToTemplate
