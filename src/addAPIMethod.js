const j = require('jscodeshift').withParser('babylon')
const {upperFirst, lowerFirst} = require('lodash')
const addImports = require('./addImports')
const insertProgramStatement = require('./insertProgramStatement')
const insertLeadingComment = require('./insertLeadingComment')

const {statement} = j.template

module.exports = function addAPIMethod(root, position, name) {
  insertLeadingComment(root, ' @flow-runtime enable')
  const {reify, assert} = addImports(root, statement`import {reify, assert} from 'flow-runtime'`)
  const {Type} = addImports(root, statement`import type {Type} from 'flow-runtime'`)

  const lower = lowerFirst(name)
  const upper = upperFirst(name)

  insertProgramStatement(root, position, statement([`export async function ${lower}(options: ${upper}Options): Promise<RETURN_TYPE> {
  await assertCan${upper}(options)
}

`]))

  insertProgramStatement(root, position, statement([`export async function assertCan${upper}(options: ${upper}Options): Promise<void> {
  ${assert}(${upper}OptionsType, options)
  const {actorId} = options
}

`]))

  insertProgramStatement(root, position, statement([`export const ${upper}OptionsType = (${reify}: ${Type}<${upper}Options>)

`]))

  insertProgramStatement(root, position, statement([`export type ${upper}Options = {
  +actorId: number,
}

`]))

  return root
}
