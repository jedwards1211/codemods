const identifierFromFile = require('./identifierFromFile')

function createExportDefaultFunction(file) {
  return `/**
 * @flow
 * @prettier
 */

export default function ${identifierFromFile(file)}() {

}`
}

module.exports = createExportDefaultFunction
