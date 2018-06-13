const j = require('jscodeshift')

function convertLambdaToReturn(lambdas) {
  lambdas.forEach(({node}) => {
    if (node.type !== 'ArrowFunctionExpression') return
    const {body} = node
    if (body.type === 'BlockStatement') return
    node.body = j.blockStatement([j.returnStatement(body)])
  })
  return lambdas
}

module.exports = convertLambdaToReturn
