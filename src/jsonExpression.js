const j = require('jscodeshift').withParser('babylon')
const map = require('lodash.map')

function jsonExpression(json) {
  switch (typeof json) {
  case 'string': return j.stringLiteral(json)
  case 'number': return j.numberLiteral(json)
  case 'boolean': return j.booleanLiteral(json)
  default: {
    if (Array.isArray(json)) {
      return j.arrayLiteral(json.map(elem => jsonExpression(elem)))
    }
    if (json instanceof Object) {
      if ('type' in json && 'loc' in json) return json
      return j.objectExpression(map(json, (value, key) => (
        j.objectProperty(
          j.identifier(key),
          jsonExpression(value)
        )
      )))
    }
    return j.nullLiteral()
  }
  }
}

module.exports = jsonExpression
