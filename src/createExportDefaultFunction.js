// @flow

const identifierFromFile = require('./identifierFromFile')

function createExportDefaultFunction(file: string): string {
  return `// @flow

export default function ${identifierFromFile(file)}() {

}`
}

module.exports = createExportDefaultFunction
