const pathInProject = require('./pathInProject')

function createApolloContainer({name, file}) {
  const queryBoilerplatePath = pathInProject(file, 'src', 'universal', 'components', 'queryBoilerplate')

  return `// @flow

import * as React from 'react'
import gql from 'graphql-tag'
import {Query} from 'react-apollo'
import queryBoilerplate from '${queryBoilerplatePath}'
import type {DefinedRenderProps} from '${queryBoilerplatePath}'

const query = gql\`
query ${name} {

}
\`

// @graphql-to-flow auto-generated
type QueryData = {

}

// @graphql-to-flow auto-generated
type QueryVariables = {

}

export type Props = {
}

const ${name} = (props: Props) => (
  <Query
    query={query}
    errorPolicy="all"
  >
    {queryBoilerplate({loading, data}: DefinedRenderProps<QueryData, QueryVariables>) => (

    ))}
  </Query>
)
export default ${name}
`
}

module.exports = createApolloContainer
