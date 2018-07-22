// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'
const j = require('jscodeshift').withParser('babylon')

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

type getStuffVariables = {}
    `

    const root = j(code)

    await addGraphQLFlowTypes({
      root,
      schemaFile: require.resolve('./schema.graphql'),
    })

    expect(root.toSource().trim()).to.equal(`import gql from 'graphql-tag'

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

type getStuffData = {
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
        mqttTag: string,
        multiplier: ?number,
        offset: ?number,
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

type createDeviceMutate = (options: {
  variables: createDeviceVariables,
}) => Promise<createDeviceData>
type createDeviceData = { device: { id: number } };

type createDeviceVariables = {
  organizationId: number,
  values: {
    name: string,
    type?: ?("MQTT"),
  },
};

type getStuffVariables = {
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
};`)
  })
})
