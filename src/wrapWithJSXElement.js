const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')
const isChildJSXElement = require('./isChildJSXElement')
const groupByParent = require('./groupByParent')

module.exports = function wrapWithJSXElement({
  root,
  filter = () => true,
  name,
}) {
  const elements = root.find(j.JSXElement).filter(filter)

  for (let group of groupByParent(elements)) {
    if (isChildJSXElement(group[0])) {
      j(group[0]).replaceWith(path => `<${name}>
${group.map(path => recast.print(path.node).toString().replace(/^/gm, '  ')).join('\n')}
</${name}>`)
    } else {
      j(group[0]).replaceWith(path => `(
  <${name}>
${group.map(path => recast.print(path.node).toString().replace(/^/gm, '    ')).join('\n')}
  </${name}>
)`)
    }
    for (let i = 1, end = group.length; i < end; i++) {
      j(group[i]).remove()
    }
  }

  return root
}
