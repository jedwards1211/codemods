/**
 * @prettier
 */
'use strict'

module.exports = function replaceModuleNamesTransform(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)
  for (const type of [
    j.FunctionDeclaration,
    j.FunctionExpression,
    j.ArrowFunctionExpression,
    j.ClassMethod,
    j.ObjectMethod,
  ]) {
    root
      .find(type, {
        async: true,
        returnType: {
          typeAnnotation: {
            id: { name: 'Promise' },
            typeParameters: {
              params: [{ type: 'VoidTypeAnnotation' }],
            },
          },
        },
      })
      .nodes()
      .forEach(n => {
        delete n.returnType
      })
  }

  return root.toSource()
}
module.exports.parser = 'babylon'
