const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')

module.exports = function wrapWithChildFunctionComponent({
  root,
  filter = () => true,
  name,
  props = '',
}) {
  const element = root.find(j.JSXElement).filter(filter).at(0)

  element.replaceWith(path => {
    return `(
  <${name}>
    {(${props}) => (
${recast.print(path.node).toString().replace(/^/gm, '      ')}
    )}
  </${name}>
)`
  })
}
