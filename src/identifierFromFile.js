// @flow

const path = require('path')
const {camelCase, upperFirst} = require('lodash')
const stripExtension = require('./stripExtension')

function identifierFromFile(file: string): string {
  const result = camelCase(stripExtension(path.basename(file)))
  if (file[0].toUpperCase() === file[0]) return upperFirst(result)
  return result
}

module.exports = identifierFromFile
