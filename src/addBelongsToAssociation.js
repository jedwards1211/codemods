const j = require('jscodeshift').withParser('babylon')
const upperFirst = require('lodash.upperfirst')
const insertNodes = require('./insertNodes')
const jsonExpression = require('./jsonExpression')
const ensureDefaultImport = require('./ensureDefaultImport')
const ensureImports = require('./ensureImports')
const getModelClassDeclaration = require('./getModelClassDeclaration')
const getInitAssociationsDeclaration = require('./getInitAssociationsDeclaration')
const classProperty = require('./classProperty')
const nullAny = require('./nullAny')

function addBelongsToAssociation({root, position, target, primaryKeyType, as, options}) {
  if (!as) as = target
  if (!primaryKeyType) primaryKeyType = 'number'
  ensureImports(root, 'value', ['Association'], 'sequelize')
  ensureImports(root, 'type', [
    'BelongsToGetOne',
    'BelongsToSetOne',
    'BelongsToCreateOne',
  ], 'sequelize')

  ensureDefaultImport(root, 'value', target, `./${target}`)
  ensureImports(root, 'type', [
    `${target}Attributes`,
    `${target}InitAttributes`,
  ], `./${target}`)

  const modelClass = getModelClassDeclaration(root)
  const source = modelClass.get('id', 'name').value

  const newProperties = [
    classProperty(as, target, null, null, {nullable: true}),
    classProperty(upperFirst(as), 'Association.BelongsTo', [source, `${target}Attributes`, `${target}InitAttributes`, target], nullAny(), {static: true}),
    classProperty(`get${upperFirst(as)}`, 'BelongsToGetOne', [target]),
    classProperty(`set${upperFirst(as)}`, 'BelongsToSetOne', [target, primaryKeyType]),
    classProperty(`create${upperFirst(as)}`, 'BelongsToCreateOne', [`${target}InitAttributes`]),
  ]

  const body = modelClass.find(j.ClassBody).get('body')
  insertNodes(body, position, ...newProperties)

  const initAssociationsMethod = getInitAssociationsDeclaration(modelClass)
  const initAssociationsBody = initAssociationsMethod.get('body', 'body').value

  initAssociationsBody.push(j.expressionStatement(j.assignmentExpression(
    '=',
    j.memberExpression(
      j.thisExpression(),
      j.identifier(upperFirst(as))
    ),
    j.callExpression(
      j.memberExpression(
        j.thisExpression(),
        j.identifier('belongsTo')
      ),
      [
        j.identifier(target),
        jsonExpression({as, ...options || {}})
      ]
    )
  )))
}

module.exports = addBelongsToAssociation
