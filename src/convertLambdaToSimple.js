function convertLambdaToSimple(lambdas) {
  lambdas.forEach(({ node }) => {
    if (node.type !== 'ArrowFunctionExpression') return
    const { body } = node
    if (body.type !== 'BlockStatement') return
    if (body.body.length > 1)
      throw new Error('body must only have one statement')
    if (body.body[0].type !== 'ReturnStatement')
      throw new Error('body must have only a return statement')
    node.body = body.body[0].argument
  })
  return lambdas
}

module.exports = convertLambdaToSimple
