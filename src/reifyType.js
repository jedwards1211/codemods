const j = require('jscodeshift').withParser('babylon')
const addImports = require('./addImports')
const insertProgramStatement = require('./insertProgramStatement')
const insertLeadingComment = require('./insertLeadingComment')

const {statement} = j.template

module.exports = function reifyType(root, position, identifier) {
  insertLeadingComment(root, ' @flow-runtime enable')

  const {reify} = addImports(root, statement`import {reify} from 'flow-runtime'`)
  const {Type} = addImports(root, statement`import type {Type} from 'flow-runtime'`)

  insertProgramStatement(root, position, statement([`export const ${identifier}Type = (${reify}: ${Type}<${identifier}>)`]))

  return root
}
