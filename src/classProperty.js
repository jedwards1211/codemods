const j = require('jscodeshift').withParser('babylon')

function classProperty(name, type, parameters, value = null, options = {}) {
  const { nullable, array } = options
  let annotation = j.genericTypeAnnotation(
    j.identifier(type),
    parameters
      ? j.typeParameterInstantiation(
          parameters.map(param =>
            j.genericTypeAnnotation(j.identifier(param), null)
          )
        )
      : null
  )
  if (array)
    annotation = j.genericTypeAnnotation(
      j.identifier('Array'),
      j.typeParameterInstantiation([annotation])
    )
  if (nullable) annotation = j.nullableTypeAnnotation(annotation)
  return j.classProperty(
    j.identifier(name),
    value,
    j.typeAnnotation(annotation),
    options.static || false
  )
}

module.exports = classProperty
