const j = require('jscodeshift').withParser('babylon')
const findImports = require('./findImports')
const graphqlToFlow = require('./graphqlToFlow')

const {statement} = j.template

module.exports = async function addGraphQLFlowTypes({root, schema, schemaFile, server}) {
  const {gql} = findImports(root, statement`import gql from 'graphql-tag'`)

  const queryPaths = [...root.find(j.TaggedTemplateExpression, {tag: {name: gql}}).paths()].reverse()

  for (let path of queryPaths) {
    const {node} = path
    const {quasi: {expressions, quasis}} = node
    if (expressions.length) continue
    const types = await graphqlToFlow({
      schema,
      schemaFile,
      server,
      query: quasis[0].value.raw,
    })
    for (let type of types) {
      const {id: {name}} = type
      const existing = root.find(j.TypeAlias, {id: {name}})
      if (existing.paths().length > 0) existing.paths()[0].replace(type)
      else j(path).closest(j.VariableDeclaration).paths()[0].insertAfter(type)
    }
  }
}
