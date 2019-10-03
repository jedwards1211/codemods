const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')
const isChildJSXElement = require('./isChildJSXElement')
const groupByParent = require('./groupByParent')

module.exports = function wrapWithJSXElement({
  root,
  filter = () => true,
  name,
}) {
  const elements = root.find(j.Node).filter(path => (
    path.node.type !== 'JSXOpeningElement' &&
    path.node.type !== 'JSXClosingElement' &&
    (path.node.type === 'JSXElement' ||
    (path.parent && path.parent.node.type === 'JSXElement'))
  )).filter(filter)

  for (let group of groupByParent(elements)) {
    if (isChildJSXElement(group[0])) {
      j(group[0]).replaceWith(`<${name}>
  ${group.map(path => recast.print(path).toString()).join('').trim()}
</${name}>
`)
    } else {
      j(group[0]).replaceWith(`(
  <${name}>
${group.map(path => recast.print(path).toString()).join('').trim().replace(/^/gm, '    ')}
  </${name}>
)`)
    }
    for (let i = 1, end = group.length; i < end; i++) {
      j(group[i]).remove()
    }
  }

  return root
}
