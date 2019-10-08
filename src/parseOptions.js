const j = require('jscodeshift').withParser('babylon')

module.exports = function parseOptions(options) {
  if (typeof options !== 'string') return options
  try {
    options = options.trim()
    if (!options.startsWith('{')) options = `{${options}}`
    options = `const foo = ${options}`
    return j(options)
      .find(j.ObjectExpression)
      .get(0).node
  } catch (error) {
    throw new Error(`Invalid options: ${error.message}
options must be an ObjectExpression or list of ObjectProperties`)
  }
}
