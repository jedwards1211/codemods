module.exports = function closestProgramStatement(path) {
  while (path) {
    if (path.parentPath && path.parentPath.parentPath &&
      path.parentPath.parentPath.value.type === 'Program'
    ) {
      return path
    }
    path = path.parentPath
  }
  throw new Error('Unexpected: failed to find an ancestor program statement')
}
