const path = require('path')
const findRoot = require('find-root')

module.exports = function pathInProject(file, ...paths) {
  const target = path.resolve(findRoot(file), ...paths)
  return path.relative(path.dirname(file), target)
}
