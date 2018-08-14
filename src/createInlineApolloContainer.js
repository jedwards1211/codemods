const j = require('jscodeshift').withParser('babylon')
const pathInProject = require('./pathInProject')
const addImports = require('./addImports')
const findProgramStatementAfter = require('./findProgramStatementAfter')
const fs = require('fs-extra')

const {statement} = j.template

async function createInlineApolloContainer({name, file, position}) {
  const queryBoilerplatePath = pathInProject(file, 'src', 'universal', 'components', 'queryBoilerplate')

  const root = j(await fs.readFile(file, 'utf8'))

  addImports(root, statement`import * as React from 'react'`)
  const {gql} = addImports(root, statement`import gql from 'graphql-tag'`)
  const {Query} = addImports(root, statement`import {Query} from 'react-apollo'`)
  const {queryBoilerplate} = addImports(root, statement([`import queryBoilerplate from '${queryBoilerplatePath}'`]))
  const {DefinedRenderProps} = addImports(root, statement([`import type {DefinedRenderProps} from '${queryBoilerplatePath}'`]))

  const program = root.find(j.Program).nodes()[0]
  const afterNode = findProgramStatementAfter(root, position)

  const statements = `const ${name}Query = ${gql}\`
query ${name} {

}
\`

// @graphql-to-flow auto-generated
type ${name}QueryData = {

}

// @graphql-to-flow auto-generated
type ${name}QueryVariables = {

}

export type ${name}Props = {
}

const ${name} = (props: ${name}Props) => (
  <${Query}
    query={${name}Query}
    errorPolicy="all"
  >
    {${queryBoilerplate}(({loading, data}: ${DefinedRenderProps}<${name}QueryData, ${name}QueryVariables>) => (

    ))}
  </${Query}>
)
`
  if (afterNode) afterNode.insertBefore(statements)
  else if (program) program.body.push(statements)

  return root.toSource()
}

module.exports = createInlineApolloContainer
