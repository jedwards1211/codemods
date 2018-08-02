// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import addGraphQLFlowTypes from '../src/addGraphQLFlowTypes'

describe(`addGraphQLFlowTypes`, function () {
  it(`works`, async function (): Promise<void> {
    const code = `
import gql from 'graphql-tag'

const query = gql\`
fragment channelFields on MQTTDeviceChannel {
  mqttTag
  multiplier
  offset
}
mutation createDevice($organizationId: Int!, $values: CreateDevice!) {
  device: createDevice(organizationId: $organizationId, value: $values) {
    id
  }
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

// auto-generated from GraphQL
type GetStuffVariables = {}

// auto-generated from GraphQL
type ObsoleteType = {}
    `

    const root = await addGraphQLFlowTypes({
      code,
      schemaFile: require.resolve('./schema.graphql'),
    })

    expect(root.toSource().trim()).to.equal(`import gql from 'graphql-tag'

import type { ApolloQueryResult, QueryRenderProps } from "react-apollo";

const query = gql\`
fragment channelFields on MQTTDeviceChannel {
  mqttTag
  multiplier
  offset
}
mutation createDevice($organizationId: Int!, $values: CreateDevice!) {
  device: createDevice(organizationId: $organizationId, value: $values) {
    id
  }
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

// auto-generated from GraphQL
type GetStuffQueryData = {
  roles: Object,
  item: ?{
    id: number,
    name: string,
    __typename: string,
  },
  MQTTDeviceChannelGroup: ?{
    id: number,
    Channels: {
      pageInfo: { hasNextPage: boolean },
      edges: ?Array<{ node: {
        id: number,
        ...ChannelFieldsData,
      } }>,
    },
    TagPrefixes: {
      id: number,
      deviceTagPrefix: string,
    },
  },
  MQTTDeviceChannel: ?{
    id: number,
    mqttTag: string,
  },
};

// auto-generated from GraphQL
type GetStuffQueryVariables = {
  userGroupId: number,
  id: number,
  newChannel: {
    deviceId: number,
    channelGroupId: number,
    direction: "FROM_DEVICE" | "TO_DEVICE",
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

// auto-generated from GraphQL
type PerformCreateDeviceMutation = (options: {
  variables: CreateDeviceMutationVariables,
}) => Promise<ApolloQueryResult<CreateDeviceMutationData>>;

// auto-generated from GraphQL
type CreateDeviceMutationData = { device: { id: number } };

// auto-generated from GraphQL
type CreateDeviceMutationVariables = {
  organizationId: number,
  values: {
    name: string,
    type?: ?("MQTT"),
  },
};

// auto-generated from GraphQL
type ChannelFieldsData = {
  mqttTag: string,
  multiplier: ?number,
  offset: ?number,
};`)
  })
})
