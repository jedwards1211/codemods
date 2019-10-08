const j = require('jscodeshift').withParser('babylon')
const upperFirst = require('lodash.upperfirst')
const insertNodes = require('./insertNodes')
const ensureDefaultImport = require('./ensureDefaultImport')
const ensureImports = require('./ensureImports')
const getModelClassDeclaration = require('./getModelClassDeclaration')
const getInitAssociationsDeclaration = require('./getInitAssociationsDeclaration')
const classProperty = require('./classProperty')
const nullAny = require('./nullAny')
const parseOptions = require('./parseOptions')

function addHasOneAssociation({
  root,
  position,
  target,
  primaryKeyType,
  as,
  options,
}) {
  if (!as) as = target
  if (!primaryKeyType) primaryKeyType = 'number'
  options = parseOptions(options)
  ensureImports(root, 'value', ['Association'], 'sequelize')
  ensureImports(
    root,
    'type',
    ['HasOneGetOne', 'HasOneSetOne', 'HasOneCreateOne'],
    'sequelize'
  )

  ensureDefaultImport(root, 'value', target, `./${target}`)
  ensureImports(
    root,
    'type',
    [`${target}Attributes`, `${target}InitAttributes`],
    `./${target}`
  )

  const modelClass = getModelClassDeclaration(root)
  const source = modelClass.get('id', 'name').value

  const newProperties = [
    classProperty(as, target, null, null, { nullable: true }),
    classProperty(
      upperFirst(as),
      'Association.HasOne',
      [source, `${target}Attributes`, `${target}InitAttributes`, target],
      nullAny(),
      { static: true }
    ),
    classProperty(`get${upperFirst(as)}`, 'HasOneGetOne', [target]),
    classProperty(`set${upperFirst(as)}`, 'HasOneSetOne', [
      target,
      primaryKeyType,
    ]),
    classProperty(`create${upperFirst(as)}`, 'HasOneCreateOne', [
      `${target}InitAttributes`,
    ]),
  ]

  const body = modelClass.find(j.ClassBody).get('body')
  insertNodes(body, position, ...newProperties)

  const initAssociationsMethod = getInitAssociationsDeclaration(modelClass)
  const initAssociationsBody = initAssociationsMethod.get('body', 'body').value

  initAssociationsBody.push(
    j.expressionStatement(
      j.assignmentExpression(
        '=',
        j.memberExpression(j.thisExpression(), j.identifier(upperFirst(as))),
        j.callExpression(
          j.memberExpression(j.thisExpression(), j.identifier('hasOne')),
          [
            j.identifier(target),
            j.objectExpression([
              j.objectProperty(j.identifier('as'), j.stringLiteral(as)),
              ...(options ? options.properties : []),
            ]),
          ]
        )
      )
    )
  )
}

module.exports = addHasOneAssociation
