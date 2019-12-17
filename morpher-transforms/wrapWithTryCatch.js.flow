const j = require('jscodeshift').withParser('babylon')
const groupByParent = require('../groupByParent')
const recast = require('recast')

module.exports = ({ pathInRange }) => ({
  description: 'wrap selected statements with try/catch block',
  transformAst: ({ text, selection, root }) => {
    const statements = root
      .find(j.Statement)
      .filter(pathInRange(text, selection))

    for (let group of groupByParent(statements)) {
      j(group[0]).replaceWith(`try {
${group
        .map(path => recast.print(path).code)
        .join('\n')
        .replace(/^/gm, '  ')}
} catch (error) {
}`)
      for (let i = 1, end = group.length; i < end; i++) {
        j(group[i]).remove()
      }
    }

    return root
  },
})
