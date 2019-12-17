const FAIL = require('./FAIL')

function resolveIdentifier(path) {
  if (path === FAIL || !path.node || path.node.type !== 'Identifier') {
    return FAIL
  }
  const scope = path.scope.lookup(path.node.name)
  if (!scope) return FAIL
  const binding = scope.getBindings()[path.node.name][0]
  if (
    !binding.parent ||
    !binding.parent.node ||
    binding.parent.node.type !== 'VariableDeclarator'
  ) {
    return FAIL
  }
  return binding.parent.get('init')
}

module.exports = resolveIdentifier
