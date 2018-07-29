const pathInProject = require('./pathInProject')

function createApolloContainer({name, file}) {
  return `// @flow

import * as React from 'react'
import gql from 'graphql-tag'
// $FlowFixMe
import {Query} from 'react-apollo'
import type {ApolloQueryResult} from 'react-apollo'
import queryBoilerplate from '${pathInProject(file, 'src', 'universal', 'components', 'queryBoilerplate')}'

const query = gql\`
query ${name} {

}
\`

// auto-generated from GraphQL
type QueryData = {

}

export type Props = {
}

const ${name} = (props: Props) => (
  <Query
    query={query}
    errorPolicy="all"
  >
    {queryBoilerplate(({loading, data}: ApolloQueryResult<QueryData>) => (

    ))}
  </Query>
)
export default ${name}
`
}

module.exports = createApolloContainer
