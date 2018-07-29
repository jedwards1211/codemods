const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')

module.exports = function wrapWithJSXElement({
  root,
  filter = () => true,
  name,
}) {
  const element = root.find(j.JSXElement).filter(filter).at(0)

  element.replaceWith(path => {
    return `<${name}>
${recast.print(path.node).toString().replace(/^/gm, '  ')}
</${name}>`
  })
}
