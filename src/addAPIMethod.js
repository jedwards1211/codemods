const j = require('jscodeshift').withParser('babylon')
const { upperFirst, lowerFirst } = require('lodash')
const addImports = require('./addImports')
const insertProgramStatement = require('./insertProgramStatement')
const insertLeadingComment = require('./insertLeadingComment')
const pathInProject = require('./pathInProject')

const { statement } = j.template

module.exports = function addAPIMethod(
  root,
  position,
  { name, options, result, returnType, appContextType, file }
) {
  insertLeadingComment(root, ' @flow-runtime enable')
  const { reify } = addImports(
    root,
    statement`import {reify} from 'flow-runtime'`
  )
  const { Type } = addImports(
    root,
    statement`import type {Type} from 'flow-runtime'`
  )

  const { assert } = addImports(
    root,
    statement([
      `import {assert} from '${pathInProject(
        file,
        'src/server/api/APIError'
      )}'`,
    ])
  )
  const { APIContext } = addImports(
    root,
    statement([
      `import APIContext from '${pathInProject(
        file,
        'src/server/api/APIContext'
      )}'`,
    ])
  )

  const lower = lowerFirst(name)
  const upper = upperFirst(name)

  insertProgramStatement(
    root,
    position,
    statement([
      `export type ${upper}Options = {
  +apiContext: ${APIContext}<${appContextType || 'any'}>,
  ${options || ''}
}

`,
    ]),
    !returnType &&
      statement([
        `export type ${upper}Result = {
  ${result || ''}
}

`,
      ]),
    statement([
      `export const ${upper}OptionsType = (${reify}: ${Type}<${upper}Options>)

`,
    ]),
    statement(
      [
        `export async function ${lower}(options: ${upper}Options): Promise<${returnType ||
          `${upper}Result`}> {
  ${assert}(${upper}OptionsType, options)
  const {apiContext} = options
  const {transaction} = apiContext
}

`,
      ].filter(Boolean)
    )
  )

  return root
}
