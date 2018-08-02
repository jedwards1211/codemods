const j = require('jscodeshift')

module.exports = function findProgramStatementAfter(root, position) {
  const program = root.find(j.Program).paths()[0].node
  const statements = root.find(j.Statement).filter(
    path => path.parentPath && path.parentPath.parentPath &&
    path.parentPath.parentPath.node === program
  )
  const result = statements.paths().find(path => path.node.end >= position)
  return result ? j(result) : null
}
