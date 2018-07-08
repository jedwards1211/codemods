const map = require('lodash/map')
const lowerCase = require('lodash/lowerCase')
const startCase = require('lodash/startCase')
const identifierFromFile = require('./identifierFromFile')
const {pluralize, singularize} = require('inflection')

module.exports = function createEnumFile(file, inputText) {
  const name = identifierFromFile(file)
  const singular = singularize(name)
  const plural = pluralize(name)

  const rx = /^\s*(.+?)(\s*=\s*(.+))?\s*$/gm
  const constants = {}

  let match
  while (match = rx.exec(inputText)) { // eslint-disable-line no-cond-assign
    constants[match[1]] = match[3] || `'${match[1]}'`
  }

  return `
// @flow
// @flow-runtime enable

export const ${plural} = {
  ${map(constants, (value, key) => `${key}: {displayText: ${JSON.stringify(startCase(lowerCase(value)))}},`).join('\n  ')}
}

export type ${singular} = $Keys<typeof ${plural}>
${map(constants, (value, key) => `export const ${key}: ${singular} = ${value}`).join('\n')}

export const ${plural}Array: Array<${singular}> = Object.keys(${plural})
export const ${plural}Set: Set<${singular}> = new Set(${plural}Array)
`
}
