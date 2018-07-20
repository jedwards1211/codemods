const recast = require('recast')
const pathInProject = require('./pathInProject')
const startCase = require('lodash/startCase')
const lowerFirst = require('lodash/lowerFirst')
const typeAnnotationToGraphQL = require('./typeAnnotationToGraphQL')
const identifierFromFile = require('./identifierFromFile')

module.exports = function createApolloForm({file, name, component, type, primaryKeys, values}) {
  const components = pathInProject(file, 'src', 'universal', 'components')
  if (!name) name = identifierFromFile(file)

  const fields = values ? values.properties.map(({key: {name}}) => name) : []

  const primaryKeyVariables = primaryKeys ? primaryKeys.properties.map(({key: {name}, value, optional}) =>
    `$${name}: ${typeAnnotationToGraphQL(value).replace(optional ? /!$/ : /$/, '')}`
  ).join(', ') : ''

  const primaryKeyBindings = primaryKeys
    ? primaryKeys.properties.map(({key: {name}}) => `${name}: $${name}`).join(', ')
    : ''

  return `// @flow

import * as React from 'react'
import pick from 'lodash/pick'
// $FlowFixMe
import {Query, Mutation} from 'react-apollo'
import gql from 'graphql-tag'
import type {FormProps} from 'redux-form'
import reduxForm from 'redux-form/es/reduxForm'
import queryBoilerplate from '${components}/queryBoilerplate'
import ApolloForm from '${components}/ApolloForm'

export const formName = '${lowerFirst(name)}'

const query = gql\`
query ${name}(${primaryKeyVariables}) {
  values: ${type}(${primaryKeyBindings}) {
    ${fields.join('\n    ')}
  }
}\`

const mutation = gql\`
mutation submit${name}(${primaryKeyVariables}${primaryKeyVariables && ', '}$values: Update${type}) {
  update${type}(${primaryKeyBindings}${primaryKeyBindings && ', '}values: $values) {
    ${fields.join('\n    ')}
  }
}\`

type Values = ${recast.print(values)}

type Update${type} = (options: {
  variables: {
    ${primaryKeys ? primaryKeys.properties.map(prop => recast.print(prop)).join(',\n    ') + ',' : ''}
    values: $Shape<Values>,
  },
}) => Promise<any>

const submitValues = [
  ${fields.map(field => JSON.stringify(field)).join(',\n  ')},
]

type Data = {
  +values: Values,
}

const ConnectedForm = reduxForm({form: formName})(ApolloForm)

export type Props = {
}

const ${name} = (props: Props): React.Node => (
  <Mutation mutation={mutation}>
    {(update${type}: Update${type}) => (
      <Query query={query} fetchPolicy="network-only">
        {queryBoilerplate({what: ${JSON.stringify(startCase(type))}})(({data}) => (
          <ConnectedForm
            component={${component}}
            data={data}
            onSubmit={values => update${type}({
              variables: {
                ${primaryKeys ? primaryKeys.properties.map(({key: {name}}) => name).join(',\n                ') + ',' : ''}
                values: pick(values, submitValues),
              },
            })}
          />
        ))}
      </Query>
    )}
  </Mutation>
)

export default ${name}
`
}
