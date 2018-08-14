// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import createApolloForm from '../src/createApolloForm'
import parseObjectTypeAnnotation from '../src/parseObjectTypeAnnotation'

describe(`createApolloForm`, function () {
  it(`works`, function () {
    const actual = createApolloForm({
      file: '/Users/andy/clarity/src/universal/features/TestFeature/TestFeatureFormContainer.js',
      component: 'TestFeatureForm',
      type: 'ContactPreferences',
      primaryKeys: parseObjectTypeAnnotation(`
        userId?: number,
        token: string,
      `),
      values: parseObjectTypeAnnotation(`{
        blockInvitations: boolean,
        foo: string,
        bar: ?number,
      }`),
    })
    expect(actual).to.equal(`// @flow

import * as React from 'react'
import pick from 'lodash/pick'
// $FlowFixMe
import {Query, Mutation} from 'react-apollo'
import gql from 'graphql-tag'
import type {FormProps} from 'redux-form'
import reduxForm from 'redux-form/es/reduxForm'
import queryBoilerplate from '../../components/queryBoilerplate'
import ApolloForm from '../../components/ApolloForm'

export const formName = 'testFeatureFormContainer'

const query = gql\`
query TestFeatureFormContainer($userId: Number, $token: String!) {
  values: ContactPreferences(userId: $userId, token: $token) {
    blockInvitations
    foo
    bar
  }
}\`

const mutation = gql\`
mutation submitTestFeatureFormContainer($userId: Number, $token: String!, $values: UpdateContactPreferences) {
  updateContactPreferences(userId: $userId, token: $token, values: $values) {
    blockInvitations
    foo
    bar
  }
}\`

type Values = {
        blockInvitations: boolean,
        foo: string,
        bar: ?number,
      }

type UpdateContactPreferences = (options: {
  variables: {
    userId?: number,
    token: string,
    values: $Shape<Values>,
  },
}) => Promise<any>

const submitValues = [
  "blockInvitations",
  "foo",
  "bar",
]

type Data = {
  +values: Values,
}

const TestFeatureFormContainerRenderer = reduxForm({form: formName})(ApolloForm)

export type Props = {
}

const TestFeatureFormContainer = (props: Props): React.Node => (
  <Mutation mutation={mutation}>
    {(updateContactPreferences: UpdateContactPreferences) => (
      <Query query={query} fetchPolicy="network-only">
        {queryBoilerplate({what: "Contact Preferences"})(({data}) => (
          <TestFeatureFormContainerRenderer
            component={TestFeatureForm}
            data={data}
            onSubmit={values => updateContactPreferences({
              variables: {
                userId,
                token,
                values: pick(values, submitValues),
              },
            })}
          />
        ))}
      </Query>
    )}
  </Mutation>
)

export default TestFeatureFormContainer
`)
  })
})
