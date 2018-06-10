module.exports = function getNearestPath(parentPath, position) {
  let nearest
  const distance = path => Math.min(
    Math.abs(path.node.start - position),
    Math.abs(path.node.end - position)
  )
  const numChildren = parentPath.get('length').value
  for (let i = 0; i < numChildren; i++) {
    const path = parentPath.get(i)
    if (path.node.start >= position && path.node.end <= position) return path
    if (!nearest || distance(path) < distance(nearest)) nearest = path
  }
  return nearest
}
