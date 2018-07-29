const j = require('jscodeshift').withParser('babylon')

module.exports = function wrapWithJSXElement({
  root,
  filter = () => true,
}) {
  const element = root.find(j.JSXElement).filter(filter).at(0)
  element.replaceWith(path => path.node.children)
}
