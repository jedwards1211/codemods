const j = require('jscodeshift').withParser('babylon')

module.exports = function insertProgramStatement(root, position, ...statements) {
  const statement = statements[0]
  const program = root.find(j.Program).at(0).nodes()[0]
  let index = program.body.findIndex(node =>
    node.end >= position
  )
  if (index < 0) index = program.body.length
  if (index === 0) {
    if (program.body.length && program.body[0].comments) {
      statement.comments = [
        ...program.body[0].comments,
        ...statement.comments || [],
      ]
      delete program.body[0].comments
    } else if (program.comments) {
      program.comments.forEach(comment => {
        comment.leading = true
      })
      statement.comments = [
        ...program.comments,
        ...statement.comments || [],
      ]
      program.comments = []
    }
    if (statement.comments) {
      statement.comments.forEach(comment => {
        delete comment.loc
        delete comment.start
        delete comment.end
      })
      delete statement.loc
      delete statement.start
      delete statement.end
    }
  }
  program.body.splice(index, 0, ...statements)
}
