const path = require('path')
const { upperFirst, camelCase } = require('lodash')
const stripExtension = require('./stripExtension')

function identifierFromFile(file) {
  let result = stripExtension(path.basename(file))
  const isUpperFirst = result[0].toUpperCase() === result[0]
  result = camelCase(result)
  if (isUpperFirst) result = upperFirst(result)
  return result
}

module.exports = identifierFromFile
