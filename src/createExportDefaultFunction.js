const identifierFromFile = require('./identifierFromFile')

function createExportDefaultFunction(file) {
  const isTypeScript = /\.tsx?$/.test(file)
  return `/**${isTypeScript ? '' : ' * @flow'}
 * @prettier
 */

export default function ${identifierFromFile(file)}() {

}`
}

module.exports = createExportDefaultFunction
