const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')
const isChildJSXElement = require('./isChildJSXElement')

module.exports = function wrapWithChildFunctionComponent({
  root,
  filter = () => true,
  name,
  props = '',
}) {
  const element = root.find(j.JSXElement).filter(filter).at(0)

  if (isChildJSXElement(element.paths()[0])) {
    element.replaceWith(path => `<${name}>
  {(${props}) => (
${recast.print(path.node).toString().replace(/^/gm, '    ')}
  )}
</${name}>`)
  } else {
    element.replaceWith(path => `(
  <${name}>
    {(${props}) => (
${recast.print(path.node).toString().replace(/^/gm, '      ')}
    )}
  </${name}>
)`)
  }
}
