const map = require('lodash/map')
const lowerCase = require('lodash/lowerCase')
const startCase = require('lodash/startCase')
const identifierFromFile = require('./identifierFromFile')
const { singularize } = require('inflection')

module.exports = function createEnumFile(file, inputText) {
  const name = identifierFromFile(file)
  const singular = singularize(name)

  const rx = /^\s*(.+?)(\s*=\s*(.+))?\s*$/gm
  const constants = {}

  let match
  while ((match = rx.exec(inputText))) {
    // eslint-disable-line no-cond-assign
    constants[match[1]] = match[3] || `'${match[1]}'`
  }

  return `
/**
 * @flow
 * @prettier
 */
// @flow-runtime enable

${map(
    constants,
    (value, key) => `export const ${key}: ${singular} = ${value}`
  ).join('\n')}

export const attributes = {
  ${map(
    constants,
    (value, key) =>
      `[${key}]: {value: ${key}, displayText: ${JSON.stringify(
        startCase(lowerCase(key))
      )}},`
  ).join('\n  ')}
}
export type ${singular} = $Keys<typeof attributes>

export const values: Array<${singular}> = Object.keys(attributes)
export const valuesSet: Set<${singular}> = new Set(values)
`
}
