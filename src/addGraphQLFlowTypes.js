const j = require('jscodeshift').withParser('babylon')
const findImports = require('./findImports')
const addImports = require('./addImports')
const graphqlToFlow = require('./graphqlToFlow')
const fs = require('fs-extra')
const {execFile} = require('promisify-child-process')
const findRoot = require('find-root')

const {expression, statement} = j.template

const AUTO_GENERATED_COMMENT = ' auto-generated from GraphQL'

module.exports = async function addGraphQLFlowTypes({file, schema, schemaFile, server}) {
  const code = await fs.readFile(file, 'utf8')
  const root = j(code)
  const {gql} = findImports(root, statement`import gql from 'graphql-tag'`)
  const {ApolloQueryResult} = addImports(root, statement`import type {ApolloQueryResult} from 'react-apollo'`)

  const findQueryPaths = root => [...root.find(j.TaggedTemplateExpression, {tag: {name: gql}}).paths()]
    .filter(path => j(path).closest(j.VariableDeclarator).size())
    .reverse()

  const queryPaths = findQueryPaths(root)

  let evalNeeded = false

  for (let path of queryPaths) {
    const {node} = path
    const {quasi: {expressions}} = node
    if (expressions.length) {
      evalNeeded = true
      break
    }
  }

  let queries
  const tempFile = file.replace(/\.js$/, '_TEMP.js')
  let tempFileWritten = false

  try {
    if (evalNeeded) {
      const tempRoot = j(code)
      const properties = []
      const {body} = tempRoot.find(j.Program).paths()[0].node
      body.push(statement`import {print as __graphql_print__} from 'graphql'
      `)
      for (let path of findQueryPaths(tempRoot)) {
        const declarator = j(path).closest(j.VariableDeclarator).nodes()[0]
        properties.push(j.objectProperty(
          j.identifier(declarator.id.name),
          expression`__graphql_print__(${j.identifier(declarator.id.name)})`
        ))
      }
      body.push(statement`console.log('__BEGIN_GRAPHQL_QUERIES__')`)
      body.push(statement`
        console.log(JSON.stringify(${j.objectExpression(properties)}))
      `)
      body.push(statement`console.log('__END_GRAPHQL_QUERIES__')`)
      tempFileWritten = true
      await fs.writeFile(tempFile, tempRoot.toSource(), 'utf8')

      const babelNode = require('path').resolve(findRoot(__dirname), 'node_modules', '.bin', 'babel-node')
      const {stdout} = await execFile(babelNode, [tempFile], {cwd: findRoot(file), encoding: 'utf8'})
      const jsonPart = stdout.substring(
        stdout.indexOf('__BEGIN_GRAPHQL_QUERIES__') + '__BEGIN_GRAPHQL_QUERIES__'.length,
        stdout.indexOf('__END_GRAPHQL_QUERIES__')
      )
      queries = JSON.parse(jsonPart)
    }

    const addedTypeAliases = new Set()

    for (let path of queryPaths) {
      const {node} = path
      const {quasi: {quasis}} = node
      const declarator = j(path).closest(j.VariableDeclarator).nodes()[0]
      const types = await graphqlToFlow({
        file,
        schema,
        schemaFile,
        server,
        query: queries && queries[declarator.id.name] || quasis[0].value.raw,
        ApolloQueryResult,
      })
      for (let type of types) {
        addedTypeAliases.add(type)
        const comment = j.commentLine(AUTO_GENERATED_COMMENT)
        comment.leading = true
        if (!type.comments) type.comments = []
        type.comments.push(comment)
        const {id: {name}} = type
        const existing = root.find(j.TypeAlias, {id: {name}})
        if (existing.size() > 0) existing.at(0).replaceWith(type)
        else j(path).closest(j.VariableDeclaration).at(0).insertAfter(type)
      }
    }

    root.find(j.TypeAlias).filter(({node}) => {
      if (addedTypeAliases.has(node)) return false
      if (!node.comments) return false
      return node.comments.findIndex(comment =>
        comment.value.trim().toLowerCase() === AUTO_GENERATED_COMMENT.trim().toLowerCase()
      ) >= 0
    }).remove()
  } finally {
    if (tempFileWritten) await fs.remove(tempFile)
  }

  return root
}
