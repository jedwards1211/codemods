const path = require('path')
const findRoot = require('find-root')

module.exports = function pathInProject(file, ...paths) {
  const target = path.resolve(findRoot(file), ...paths)
  if (path.dirname(file) === path.dirname(target)) return `./${path.basename(target)}`
  return path.relative(path.dirname(file), target)
}
