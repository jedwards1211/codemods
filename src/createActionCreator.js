const { upperFirst, snakeCase } = require('lodash')

module.exports = function createActionCreator(name) {
  const type = snakeCase(name).toUpperCase()
  const action = `${upperFirst(name)}Action`
  return `
export const ${type} = '${type}'

export type ${action} = {
  type: string,
}

export function ${name}(): ${action} {
  return {
    type: ${type},
  }
}
`
}
