const j = require('jscodeshift').withParser('babylon')
const addImports = require('./addImports')
const insertProgramStatement = require('./insertProgramStatement')
const insertLeadingComment = require('./insertLeadingComment')
const {pluralize} = require('inflection')

const {statement} = j.template

module.exports = function addFindAllAPIMethod(root, position, modelName) {
  insertLeadingComment(root, ' @flow-runtime enable')
  const {FindOptions} = addImports(root, statement`import type {FindOptions} from 'sequelize'`)
  modelName = addImports(root, statement([`import ${modelName} from '../models/${modelName}'`]))[modelName]
  const plural = pluralize(modelName)

  const {reify} = addImports(root, statement`import {reify} from 'flow-runtime'`)
  const {Type} = addImports(root, statement`import type {Type} from 'flow-runtime'`)

  const {assert} = addImports(root, statement`import {assert} from './APIError'`)

  insertProgramStatement(
    root,
    position,
    statement([`export type FindAll${plural}Options = {
  +actorId: number,
}

`]),
    statement([`export const FindAll${plural}OptionsType = (${reify}: ${Type}<FindAll${plural}Options>)

`]),
    statement([`export async function assertCanFindAll${plural}(options: FindAll${plural}Options): Promise<void> {
  ${assert}(FindAll${plural}OptionsType, options)
  const {actorId} = options
}

`]),
    statement([`export async function getFindAll${plural}Query(options: FindAll${plural}Options): Promise<${FindOptions}<${modelName}>> {

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
