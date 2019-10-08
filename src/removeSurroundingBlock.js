const j = require('jscodeshift').withParser('babylon')

module.exports = function removeSurroundingBlock(root, filter = () => true) {
  root
    .find(j.BlockStatement)
    .filter(filter)
    .forEach(path => {
      let closestStatementPath

      let child = path
      let parent = child.parentPath
      while (parent != null) {
        if (
          parent.node.type === 'BlockStatement' ||
          parent.node.type === 'Program'
        ) {
          closestStatementPath = child
          break
        }
        child = parent
        parent = child.parentPath
      }

      closestStatementPath.replace(...path.node.body)
    })
}
