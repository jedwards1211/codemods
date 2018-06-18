const j = require('jscodeshift').withParser('babylon')
const addImports = require('./addImports')
const insertProgramStatement = require('./insertProgramStatement')
const insertLeadingComment = require('./insertLeadingComment')

const {statement} = j.template

module.exports = function addFindOneAPIMethod(root, position, modelName) {
  insertLeadingComment(root, ' @flow-runtime enable')
  const {FindOptions} = addImports(root, statement`import type {FindOptions} from 'sequelize'`)
  modelName = addImports(root, statement([`import ${modelName} from '../models/${modelName}'`]))[modelName]

  const {reify} = addImports(root, statement`import {reify} from 'flow-runtime'`)
  const {Type} = addImports(root, statement`import type {Type} from 'flow-runtime'`)

  const {assert} = addImports(root, statement`import {assert} from './APIError'`)

  insertProgramStatement(
    root,
    position,
    statement([`export type FindOne${modelName}Options = {
  +actorId: number,
}

`]),
    statement([`export const FindOne${modelName}OptionsType = (${reify}: ${Type}<FindOne${modelName}Options>)

`]),
    statement([`export async function assertCanFindOne${modelName}(options: FindOne${modelName}Options): Promise<void> {
  ${assert}(FindOne${modelName}OptionsType, options)
  const {actorId} = options
}

`]),
    statement([`export async function getFindOne${modelName}Query(options: FindOne${modelName}Options): Promise<${FindOptions}<${modelName}>> {

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
