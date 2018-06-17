const path = require('path')
const findRoot = require('find-root')

function pathToTheme(file) {
  const theme = path.resolve(findRoot(file), 'src', 'universal', 'theme')
  return path.relative(path.dirname(file), theme)
}

module.exports = pathToTheme
