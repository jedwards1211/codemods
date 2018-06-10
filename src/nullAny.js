const j = require('jscodeshift').withParser('babylon')

function nullAny() {
  return j.typeCastExpression(
    j.nullLiteral(),
    j.typeAnnotation(j.anyTypeAnnotation())
  )
}

module.exports = nullAny
