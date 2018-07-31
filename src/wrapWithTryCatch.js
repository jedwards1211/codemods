const j = require('jscodeshift').withParser('babylon')
const groupByParent = require('./groupByParent')
const recast = require('recast')

module.exports = function wrapWithTryCatch({
  root,
  filter = () => true,
}) {
  const statements = root.find(j.Statement).filter(filter)

  for (let group of groupByParent(statements)) {
    j(group[0]).replaceWith(`try {
${group.map(path => recast.print(path.node).toString()).join('\n').replace(/^/gm, '  ')}
} catch (error) {
}`)
    for (let i = 1, end = group.length; i < end; i++) {
      j(group[i]).remove()
    }
  }

  return root
}
