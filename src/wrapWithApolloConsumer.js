const j = require('jscodeshift').withParser('babylon')
const {statement} = j.template
const addImports = require('./addImports')
const wrapWithChildFunctionComponent = require('./wrapWithChildFunctionComponent')

module.exports = function wrapWithApolloConsumer(root, filter = () => true) {
  const {ApolloConsumer} = addImports(root, statement`import {ApolloConsumer} from 'react-apollo'`)

  return wrapWithChildFunctionComponent({
    root,
    filter,
    name: ApolloConsumer,
    props: 'client',
  })
}
