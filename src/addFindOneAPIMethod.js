const j = require('jscodeshift').withParser('babylon')
const addImports = require('./addImports')
const insertProgramStatement = require('./insertProgramStatement')
const insertLeadingComment = require('./insertLeadingComment')
const pathInProject = require('./pathInProject')

const {statement} = j.template

module.exports = function addFindOneAPIMethod(root, position, {modelName, appContextType, file}) {
  insertLeadingComment(root, ' @flow-runtime enable')
  const {FindOptions} = addImports(root, statement`import type {FindOptions} from 'sequelize'`)
  modelName = addImports(root, statement([`import ${modelName} from '../models/${modelName}'`]))[modelName]

  const {reify} = addImports(root, statement`import {reify} from 'flow-runtime'`)
  const {Type} = addImports(root, statement`import type {Type} from 'flow-runtime'`)

  const {assert} = addImports(root, statement([`import {assert} from '${pathInProject(file, 'src/server/api/APIError')}'`]))
  const {APIContext} = addImports(root, statement([`import APIContext from '${pathInProject(file, 'src/server/api/APIContext')}'`]))

  insertProgramStatement(
    root,
    position,
    statement([`export type FindOne${modelName}Options = {
  +apiContext: ${APIContext}<${appContextType || 'any'}>,
}

`]),
    statement([`export const FindOne${modelName}OptionsType = (${reify}: ${Type}<FindOne${modelName}Options>)

`]),
    statement([`export async function assertCanFindOne${modelName}(options: FindOne${modelName}Options): Promise<void> {
  ${assert}(FindOne${modelName}OptionsType, options)
  const { apiContext } = options
}

`]),
    statement([`export async function getFindOne${modelName}Query(options: FindOne${modelName}Options): Promise<${FindOptions}<${modelName}>> {
  const { apiContext } = options
  const { findOptions } = apiContext

  const where = {}

  return { where, ...findOptions }
}

`]),
    statement([`export async function findOne${modelName}(options: FindOne${modelName}Options): Promise<?${modelName}> {
  await assertCanFindOne${modelName}(options)
  return await ${modelName}.findOne(await getFindOne${modelName}Query(options))
}

`])
  )

  return root
}
