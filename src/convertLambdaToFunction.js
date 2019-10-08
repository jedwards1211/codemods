const j = require('jscodeshift')

function convertLambdaToReturn(lambdas) {
  lambdas.replaceWith(({ node }) => {
    if (node.type !== 'ArrowFunctionExpression') return node
    const body =
      node.body.type === 'BlockStatement'
        ? node.body
        : j.blockStatement([j.returnStatement(node.body)])
    let decl
    if (node.typeParameters) {
      decl = j.functionDeclaration(
        j.identifier('anonymous'),
        node.params,
        body,
        node.generator
      )
      decl.typeParameters = node.typeParameters
    } else {
      decl = j.functionExpression(
        node.typeParameters ? j.identifier('anonymous') : null,
        node.params,
        body,
        node.generator
      )
    }
    if (node.returnType) decl.returnType = node.returnType
    return decl
  })
  return lambdas
}

module.exports = convertLambdaToReturn
