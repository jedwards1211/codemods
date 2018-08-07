// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import addGraphQLFlowTypes from '../src/addGraphQLFlowTypes'

describe(`addGraphQLFlowTypes`, function () {
  it(`works`, async function (): Promise<void> {
    const code = `
import {Query, Mutation} from 'react-apollo'
import gql from 'graphql-tag'

// @graphql-to-flow ignore
const ignoredQuery = gql\`
query {
  currentUser
}
\`

// @graphql-to-flow extract-types: MQTTDeviceChannel, DeviceDirection
const query = gql\`
fragment channelFields on MQTTDeviceChannel {
  mqttTag
  multiplier
  offset
}
query getStuff($userGroupId: Int!, $id: Int!, $newChannel: CreateMQTTDeviceChannel!) {
  roles: userGroupRolesInDeviceGroup(userGroupId: $userGroupId, deviceGroupId: $id)
  item: UserGroup(id: $userGroupId) {
    id
    name
    __typename
  }
  MQTTDeviceChannelGroup(id: $channelGroupId) {
    id
    direction
    Channels {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          ...channelFields
        }
      }
    }
    TagPrefixes {
      id
      deviceTagPrefix
    }
  }
  MQTTDeviceChannel(id: 5) {
    id
    mqttTag
  }
}
\`

const mutation = gql\`
mutation createDevice($organizationId: Int!, $values: CreateDevice!) {
  device: createDevice(organizationId: $organizationId, value: $values) {
    id
  }
}
\`

// @graphql-to-flow auto-generated
type GetStuffVariables = {}

// @graphql-to-flow auto-generated
type ObsoleteType = {}

const ViewContainer = () => (
  <Mutation mutation={mutation}>
    {(createDevice) => (
      <Query
        query={query}
        variables={{baz: 'qux'}}
      >
        {(data) => (
          <div />
        )}
      </Query>
    )}
  </Mutation>
)
`

    const root = await addGraphQLFlowTypes({
      code,
      schemaFile: require.resolve('./schema.graphql'),
    })

    expect(root.toSource().trim()).to.equal(`import {Query, Mutation} from 'react-apollo'
import gql from 'graphql-tag'

import type { MutationFunction, QueryRenderProps } from "react-apollo";

// @graphql-to-flow ignore
const ignoredQuery = gql\`
query {
  currentUser
}
\`

// @graphql-to-flow extract-types: MQTTDeviceChannel, DeviceDirection
const query = gql\`
fragment channelFields on MQTTDeviceChannel {
  mqttTag
  multiplier
  offset
}
query getStuff($userGroupId: Int!, $id: Int!, $newChannel: CreateMQTTDeviceChannel!) {
  roles: userGroupRolesInDeviceGroup(userGroupId: $userGroupId, deviceGroupId: $id)
  item: UserGroup(id: $userGroupId) {
    id
    name
    __typename
  }
  MQTTDeviceChannelGroup(id: $channelGroupId) {
    id
    direction
    Channels {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          ...channelFields
        }
      }
    }
    TagPrefixes {
      id
      deviceTagPrefix
    }
  }
  MQTTDeviceChannel(id: 5) {
    id
    mqttTag
  }
}
\`

// @graphql-to-flow auto-generated
type GetStuffQueryData = {
  roles: Object,
  item: ?{
    id: number,
    name: string,
    __typename: string,
  },
  MQTTDeviceChannelGroup: ?{
    id: number,
    direction: DeviceDirection1,
    Channels: {
      pageInfo: { hasNextPage: boolean },
      edges: ?Array<{ node: MQTTDeviceChannel }>,
    },
    TagPrefixes: {
      id: number,
      deviceTagPrefix: string,
    },
  },
  MQTTDeviceChannel: ?MQTTDeviceChannel1,
};

// @graphql-to-flow auto-generated
type MQTTDeviceChannel1 = {
  id: number,
  mqttTag: string,
};

// @graphql-to-flow auto-generated
type MQTTDeviceChannel = {
  id: number,
  ...ChannelFieldsData,
};

// @graphql-to-flow auto-generated
type DeviceDirection1 = "FROM_DEVICE" | "TO_DEVICE";

// @graphql-to-flow auto-generated
type GetStuffQueryVariables = {
  userGroupId: number,
  id: number,
  newChannel: {
    deviceId: number,
    channelGroupId: number,
    direction: DeviceDirection,
    tagInDevice: string,
    MetadataItem?: ?{
      tag?: ?string,
      organizationId?: ?number,
      tagInOrganization?: ?string,
      name: string,
      dataType: "number" | "string" | "group",
      isDigital?: ?boolean,
      units?: ?string,
      min?: ?number,
      max?: ?number,
      rounding?: ?number,
      displayPrecision?: ?number,
    },
    mqttTag: string,
    enabled?: ?boolean,
    name?: ?string,
    multiplier?: ?number,
    offset?: ?number,
  },
};

// @graphql-to-flow auto-generated
type DeviceDirection = "FROM_DEVICE" | "TO_DEVICE";

// @graphql-to-flow auto-generated
type ChannelFieldsData = {
  mqttTag: string,
  multiplier: ?number,
  offset: ?number,
};

const mutation = gql\`
mutation createDevice($organizationId: Int!, $values: CreateDevice!) {
  device: createDevice(organizationId: $organizationId, value: $values) {
    id
  }
}
\`

// @graphql-to-flow auto-generated
type CreateDeviceMutationFunction = MutationFunction<CreateDeviceMutationData, CreateDeviceMutationVariables>;

// @graphql-to-flow auto-generated
type CreateDeviceMutationData = { device: { id: number } };

// @graphql-to-flow auto-generated
type CreateDeviceMutationVariables = {
  organizationId: number,
  values: {
    name: string,
    type?: ?("MQTT"),
  },
};

const ViewContainer = () => (
  <Mutation mutation={mutation}>
    {(createDevice: CreateDeviceMutationFunction) => (
      <Query
        query={query}
        variables={({baz: 'qux'}: GetStuffQueryVariables)}
      >
        {(data: GetStuffQueryData) => (
          <div />
        )}
      </Query>
    )}
  </Mutation>
)`)
  })
})
