const pathInProject = require('./pathInProject')

function pathToTheme(file) {
  return pathInProject(file, 'src', 'universal', 'theme')
}

module.exports = pathToTheme
