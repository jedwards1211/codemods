module.exports = function typeAnnotationToGraphQL(annotation) {
  switch (annotation.type) {
    case 'StringTypeAnnotation':
      return 'String!'
    case 'NumberTypeAnnotation':
      return 'Number!'
    case 'ObjectTypeAnnotation':
      return 'JSON!'
    case 'NullableTypeAnnotation':
      return typeAnnotationToGraphQL(annotation.typeAnnotation).replace(
        /!$/,
        ''
      )
    case 'GenericTypeAnnotation': {
      if (annotation.id.name === 'Array') {
        return `[${typeAnnotationToGraphQL(
          annotation.typeParameters.params[0]
        )}]!`
      }
      return `${annotation.id.name}!`
    }
    default: {
      throw new Error(
        `I don't know which GraphQL type corresponds to ${annotation.type}`
      )
    }
  }
}
