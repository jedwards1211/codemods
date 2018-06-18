const j = require('jscodeshift').withParser('babylon')
const upperFirst = require('lodash.upperfirst')
const insertNodes = require('./insertNodes')
const jsonExpression = require('./jsonExpression')
const {singularize, pluralize} = require('inflection')
const ensureDefaultImport = require('./ensureDefaultImport')
const ensureImports = require('./ensureImports')
const getModelClassDeclaration = require('./getModelClassDeclaration')
const getInitAssociationsDeclaration = require('./getInitAssociationsDeclaration')
const classProperty = require('./classProperty')
const nullAny = require('./nullAny')

function addBelongsToManyAssociation({root, position, target, through, primaryKeyType, as, asSingular, asPlural, options}) {
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
  if (!as) as = asPlural
  if (!primaryKeyType) primaryKeyType = 'number'
  ensureImports(root, 'value', ['Association'], 'sequelize')
  ensureImports(root, 'type', [
    'BelongsToManyGetMany',
    'BelongsToManySetMany',
    'BelongsToManyAddMany',
    'BelongsToManyAddOne',
    'BelongsToManyCreateOne',
    'BelongsToManyRemoveOne',
    'BelongsToManyRemoveMany',
    'BelongsToManyHasOne',
    'BelongsToManyBelongsToMany',
    'BelongsToManyCount',
  ], 'sequelize')

  ensureDefaultImport(root, 'value', target, `./${target}`)
  ensureImports(root, 'type', [
    `${target}Attributes`,
    `${target}InitAttributes`,
  ], `./${target}`)
  ensureImports(root, 'type', [
    `${through}Attributes`,
    `${through}ThroughInitAttributes`,
  ], `./${through}`)

  const modelClass = getModelClassDeclaration(root)
  const source = modelClass.get('id', 'name').value

  const newProperties = [
    classProperty(asPlural, target, null, null, {nullable: true, array: true}),
    classProperty(upperFirst(asPlural), 'Association.BelongsToMany', [
      `${source}Attributes`,
      `${source}InitAttributes`,
      source,
      `${target}Attributes`,
      `${target}InitAttributes`,
      target,
      `${through}Attributes`,
      through,
    ], nullAny(), {static: true}),
    classProperty(`get${upperFirst(asPlural)}`, 'BelongsToManyGetMany', [target]),
    classProperty(`set${upperFirst(asPlural)}`, 'BelongsToManySetMany', [target, primaryKeyType, `${through}ThroughInitAttributes`]),
    classProperty(`add${upperFirst(asPlural)}`, 'BelongsToManyAddMany', [target, primaryKeyType, `${through}ThroughInitAttributes`]),
    classProperty(`add${upperFirst(asSingular)}`, 'BelongsToManyAddOne', [target, primaryKeyType, `${through}ThroughInitAttributes`]),
    classProperty(`create${upperFirst(asSingular)}`, 'BelongsToManyCreateOne', [`${target}InitAttributes`, target, `${through}ThroughInitAttributes`]),
    classProperty(`remove${upperFirst(asSingular)}`, 'BelongsToManyRemoveOne', [target, primaryKeyType]),
    classProperty(`remove${upperFirst(asPlural)}`, 'BelongsToManyRemoveMany', [target, primaryKeyType]),
    classProperty(`has${upperFirst(asSingular)}`, 'BelongsToManyHasOne', [target, primaryKeyType]),
    classProperty(`has${upperFirst(asPlural)}`, 'BelongsToManyHasMany', [target, primaryKeyType]),
    classProperty(`count${upperFirst(asPlural)}`, 'BelongsToManyCount')
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
        j.identifier('belongsToMany')
      ),
      [
        j.identifier(target),
        jsonExpression(Object.assign({through: j.identifier(through), as}, options || {}))
      ]
    )
  )))
}

module.exports = addBelongsToManyAssociation
