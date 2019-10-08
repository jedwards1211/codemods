const j = require('jscodeshift').withParser('babylon')

module.exports = function insertLeadingComment(root, value) {
  const program = root.find(j.Program).nodes()[0]
  const commentLine = j.commentLine(value, true, false)
  if (
    program.comments &&
    program.comments.findIndex(
      comment => comment.value.trim() === value.trim()
    ) < 0
  ) {
    program.comments.push(commentLine)
  }
  if (program.body.length) {
    const firstStatement = program.body[0]
    if (
      firstStatement.comments &&
      firstStatement.comments.findIndex(
        comment => comment.value.trim() === value.trim()
      ) < 0
    ) {
      firstStatement.comments.push(commentLine)
    }
  }
  return root
}
