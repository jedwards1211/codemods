const identifierFromFile = require('./identifierFromFile')
const { pluralize, singularize } = require('inflection')

module.exports = function addEnum(name, file) {
  if (!name) name = identifierFromFile(file)
  const singular = singularize(name)
  const plural = pluralize(name)
  return `export const ${plural} = {
  $END$
}

export type ${singular} = $Keys<typeof ${plural}>

export const ${plural}Array: Array<${singular}> = Object.keys(${plural})
export const ${plural}Set: Set<${singular}> = new Set(${plural}Array)
  `
}
