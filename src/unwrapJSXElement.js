const j = require('jscodeshift').withParser('babylon')
const isChildJSXElement = require('./isChildJSXElement')

module.exports = function wrapWithJSXElement({ root, filter = () => true }) {
  const element = root
    .find(j.JSXElement)
    .filter(filter)
    .at(0)
  const path = element.paths()[0]
  const { node } = path
  if (!isChildJSXElement(path) && node.children.length > 1) {
    node.openingElement = j.jsxOpeningElement(
      j.jsxMemberExpression(
        j.jsxIdentifier('React'),
        j.jsxIdentifier('Fragment')
      ),
      [],
      false
    )
    node.closingElement = j.jsxClosingElement(
      j.jsxMemberExpression(
        j.jsxIdentifier('React'),
        j.jsxIdentifier('Fragment')
      )
    )
  } else {
    element.replaceWith(path => path.node.children)
  }
}
