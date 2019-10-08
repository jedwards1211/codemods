const j = require('jscodeshift')
const { some } = require('lodash/fp')

module.exports = function hasFlowAnnotation(root) {
  return root
    .find(j.Comment)
    .some(path =>
      some(comment => /@flow\s*$/m.test(comment.value))(path.node.comments)
    )
}
