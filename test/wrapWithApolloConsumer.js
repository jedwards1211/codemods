// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import wrapWithApolloConsumer from '../src/wrapWithApolloConsumer'

const j = jscodeshift.withParser('babylon')

describe(`wrapWithApolloConsumer`, function () {
  it(`works`, function () {
    const root = j(`
const ListRoute = (props: ListRouteProps) => (
  <AdminListView
    ListItem={DeviceListItem}
    showCreateButton
  />
)
`)

    wrapWithApolloConsumer(root)

    expect(root.toSource()).to.equal(`
import { ApolloConsumer } from "react-apollo";
const ListRoute = (props: ListRouteProps) => (
  <ApolloConsumer>
    {client => (
      <AdminListView
        ListItem={DeviceListItem}
        showCreateButton
      />
    )}
  </ApolloConsumer>
)
`)
  })
})
