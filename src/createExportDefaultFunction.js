const identifierFromFile = require('./identifierFromFile')

function createExportDefaultFunction(file) {
  return `// @flow

export default function ${identifierFromFile(file)}() {

}`
}

module.exports = createExportDefaultFunction
