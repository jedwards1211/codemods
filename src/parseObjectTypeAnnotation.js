const j = require('jscodeshift').withParser('babylon')

module.exports = function parseObjectTypeAnnotation(annotation) {
  if (typeof annotation !== 'string') return annotation
  try {
    annotation = annotation.trim()
    if (!/\s*\{/m.test(annotation)) annotation = `{${annotation}}`
    annotation = `type foo = ${annotation}`
    return j(annotation).find(j.ObjectTypeAnnotation).get(0).node
  } catch (error) {
    throw new Error(`Invalid ObjectTypeAnnotation: ${error.message}
options must be an ObjectTypeAnnotation or list of ObjectTypeProperties`)
  }
}
