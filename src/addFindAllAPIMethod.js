const j = require('jscodeshift').withParser('babylon')
const addImports = require('./addImports')
const insertProgramStatement = require('./insertProgramStatement')
const insertLeadingComment = require('./insertLeadingComment')
const {pluralize} = require('inflection')
const pathInProject = require('./pathInProject')

const {statement} = j.template

module.exports = function addFindAllAPIMethod(root, position, {modelName, appContextType, file}) {
  insertLeadingComment(root, ' @flow-runtime enable')
  const {FindOptions} = addImports(root, statement`import type {FindOptions} from 'sequelize'`)
  modelName = addImports(root, statement([`import ${modelName} from '../models/${modelName}'`]))[modelName]
  const plural = pluralize(modelName)

  const {reify} = addImports(root, statement`import {reify} from 'flow-runtime'`)
  const {Type} = addImports(root, statement`import type {Type} from 'flow-runtime'`)

  const {assert} = addImports(root, statement([`import {assert} from '${pathInProject(file, 'src/server/api/APIError')}'`]))
  const {APIContext} = addImports(root, statement([`import APIContext from '${pathInProject(file, 'src/server/api/APIContext')}'`]))

  insertProgramStatement(
    root,
    position,
    statement([`export type FindAll${plural}Options = {
  +apiContext: ${APIContext}<${appContextType || 'any'}>,
}

`]),
    statement([`export const FindAll${plural}OptionsType = (${reify}: ${Type}<FindAll${plural}Options>)

`]),
    statement([`export async function assertCanFindAll${plural}(options: FindAll${plural}Options): Promise<void> {
  ${assert}(FindAll${plural}OptionsType, options)
  const { apiContext } = options
}

`]),
    statement([`export async function getFindAll${plural}Query(options: FindAll${plural}Options): Promise<${FindOptions}<${modelName}>> {
  const { apiContext } = options
  const { findOptions } = apiContext

  const where = {}

  return { where, ...findOptions }
}

`]),
    statement([`export async function findAll${plural}(options: FindAll${plural}Options): Promise<Array<${modelName}>> {
  await assertCanFindAll${plural}(options)
  return await ${modelName}.findAll(await getFindAll${plural}Query(options))
}

`])
  )

  return root
}
