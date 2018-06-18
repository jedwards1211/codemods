const j = require('jscodeshift').withParser('babylon')

module.exports = function insertProgramStatement(root, position, statement) {
  const program = root.find(j.Program).at(0).nodes()[0]
  let index = program.body.findIndex(node =>
    node.end >= position
  )
  if (index < 0) index = program.body.length
  if (index === 0 && program.body.length) {
    if (program.body[0].leadingComments) {
      statement.leadingComments = program.body[0].leadingComments
      delete program.body[0].leadingComments
    }
  }
  program.body.splice(index, 0, statement)
  console.log(program.body)
}
