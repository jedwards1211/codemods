module.exports = function closestProgramStatement(path) {
  if (typeof path.paths === 'function') return path.map(closestProgramStatement)
  while (path) {
    if (
      path.parentPath &&
      path.parentPath.parentPath &&
      path.parentPath.parentPath.value.type === 'Program'
    ) {
      return path
    }
    path = path.parentPath
  }
  throw new Error('Unexpected: failed to find an ancestor program statement')
}
