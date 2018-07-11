const j = require('jscodeshift').withParser('babylon')
const upperFirst = require('lodash.upperfirst')
const insertNodes = require('./insertNodes')
const {singularize, pluralize} = require('inflection')
const ensureDefaultImport = require('./ensureDefaultImport')
const ensureImports = require('./ensureImports')
const getModelClassDeclaration = require('./getModelClassDeclaration')
const getInitAssociationsDeclaration = require('./getInitAssociationsDeclaration')
const classProperty = require('./classProperty')
const nullAny = require('./nullAny')
const parseOptions = require('./parseOptions')

function addHasManyAssociation({root, position, target, primaryKeyType, as, asSingular, asPlural, options}) {
  if (asPlural) {
    if (!asSingular) asSingular = singularize(asPlural)
  } else if (asSingular) {
    if (!asPlural) asPlural = pluralize(asSingular)
  } else if (as) {
    asSingular = singularize(as)
    asPlural = pluralize(as)
  } else {
    as = asPlural = pluralize(target)
    asSingular = singularize(target)
  }
  if (!primaryKeyType) primaryKeyType = 'number'
  options = parseOptions(options)
  ensureImports(root, 'value', ['Association'], 'sequelize')
  ensureImports(root, 'type', [
    'HasManyGetMany',
    'HasManySetMany',
    'HasManyAddMany',
    'HasManyAddOne',
    'HasManyCreateOne',
    'HasManyRemoveOne',
    'HasManyRemoveMany',
    'HasManyHasOne',
    'HasManyHasMany',
    'HasManyCount',
  ], 'sequelize')

  ensureDefaultImport(root, 'value', target, `./${target}`)
  ensureImports(root, 'type', [
    `${target}Attributes`,
    `${target}InitAttributes`,
  ], `./${target}`)

  const modelClass = getModelClassDeclaration(root)
  const source = modelClass.get('id', 'name').value

  const newProperties = [
    classProperty(asPlural, target, null, null, {nullable: true, array: true}),
    classProperty(upperFirst(asPlural), 'Association.HasMany', [source, `${target}Attributes`, `${target}InitAttributes`, target], nullAny(), {static: true}),
    classProperty(`get${upperFirst(asPlural)}`, 'HasManyGetMany', [target]),
    classProperty(`set${upperFirst(asPlural)}`, 'HasManySetMany', [target, primaryKeyType]),
    classProperty(`add${upperFirst(asPlural)}`, 'HasManyAddMany', [target, primaryKeyType]),
    classProperty(`add${upperFirst(asSingular)}`, 'HasManyAddOne', [target, primaryKeyType]),
    classProperty(`create${upperFirst(asSingular)}`, 'HasManyCreateOne', [`${target}InitAttributes`, target]),
    classProperty(`remove${upperFirst(asSingular)}`, 'HasManyRemoveOne', [target, primaryKeyType]),
    classProperty(`remove${upperFirst(asPlural)}`, 'HasManyRemoveMany', [target, primaryKeyType]),
    classProperty(`has${upperFirst(asSingular)}`, 'HasManyHasOne', [target, primaryKeyType]),
    classProperty(`has${upperFirst(asPlural)}`, 'HasManyHasMany', [target, primaryKeyType]),
    classProperty(`count${upperFirst(asPlural)}`, 'HasManyCount')
  ]

  const body = modelClass.find(j.ClassBody).get('body')
  insertNodes(body, position, ...newProperties)

  const initAssociationsMethod = getInitAssociationsDeclaration(modelClass)
  const initAssociationsBody = initAssociationsMethod.get('body', 'body').value

  initAssociationsBody.push(j.expressionStatement(j.assignmentExpression(
    '=',
    j.memberExpression(
      j.thisExpression(),
      j.identifier(upperFirst(asPlural))
    ),
    j.callExpression(
      j.memberExpression(
        j.thisExpression(),
        j.identifier('hasMany')
      ),
      [
        j.identifier(target),
        j.objectExpression([
          j.objectProperty(j.identifier('as'), j.stringLiteral(as)),
          ...(options ? options.properties : []),
        ]),
      ]
    )
  )))
}

module.exports = addHasManyAssociation
