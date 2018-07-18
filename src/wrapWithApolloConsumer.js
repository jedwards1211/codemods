const j = require('jscodeshift').withParser('babylon')
const {statement} = j.template
const recast = require('recast')
const addImports = require('./addImports')

module.exports = function wrapWithApolloConsumer(root, filter = () => true) {
  const {ApolloConsumer} = addImports(root, statement`import {ApolloConsumer} from 'react-apollo'`)

  const element = root.find(j.JSXElement).filter(filter).at(0)

  element.replaceWith(path => {
    return `(
  <${ApolloConsumer}>
    {client => (
${recast.print(path.node).toString().replace(/^/gm, '      ')}
    )}
  </${ApolloConsumer}>
)`
  })
}
