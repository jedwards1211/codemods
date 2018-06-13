const j = require('jscodeshift')

function convertFSCToComponent(collection) {
  function convertBase(node, id) {
    const propsParam = node.params[0]
    const renderBody = []
    if (propsParam) renderBody.push(
      j.variableDeclaration(
        'const',
        [
          j.variableDeclarator(
            propsParam,
            j.memberExpression(
              j.thisExpression(),
              j.identifier('props')
            )
          )
        ]
      )
    )
    if (node.body.type === 'BlockStatement') renderBody.push(...node.body.body)
    else renderBody.push(j.returnStatement(node.body))

    const renderMethod = j.classMethod(
      'method',
      j.identifier('render'),
      [],
      j.blockStatement(renderBody)
    )

    if (node.returnType) renderMethod.returnType = node.returnType

    const decl = j.classDeclaration(
      id || null,
      j.classBody([
        renderMethod,
      ]),
      j.memberExpression(
        j.identifier('React'),
        j.identifier('Component')
      )
    )

    if (node.typeParameters) decl.typeParameters = node.typeParameters
    if (propsParam && propsParam.typeAnnotation) decl.superTypeParameters = j.typeParameterInstantiation([
      propsParam.typeAnnotation.typeAnnotation
    ])

    decl.__convertedToReactClass = true

    return decl
  }

  collection.find(j.FunctionDeclaration).replaceWith(path =>
    convertBase(path.node, path.node.id)
  )

  collection.find(j.VariableDeclaration).replaceWith(path => {
    if (path.node.declarations.length > 1) return path.node
    const [declarator] = path.node.declarations
    if (
      declarator.init.type === 'ArrowFunctionExpression' ||
      declarator.init.type === 'FunctionExpression'
    ) {
      return convertBase(declarator.init, declarator.id)
    }
    return path.node
  })

  function isInsideConverted(path) {
    while (path) {
      if (path.node.__convertedToReactClass) return true
      path = path.parent
    }
    return false
  }

  collection.find(j.VariableDeclarator, {init: {type: 'ArrowFunctionExpression'}}).replaceWith(path => {
    if (isInsideConverted(path) || path.parent.node.type === 'VariableDeclaration') return path.node
    return convertBase(path.node.init, path.node.id)
  })

  collection.find(j.ArrowFunctionExpression).replaceWith(path => {
    if (isInsideConverted(path) || path.parent.node.type === 'VariableDeclarator') return path.node
    return convertBase(path.node)
  })

  return collection
}

module.exports = convertFSCToComponent
