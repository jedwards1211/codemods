// @flow

import { describe, it } from 'mocha'
import * as recast from 'recast'

import graphqlToFlow from '../src/graphqlToFlow'

import pipeline from '../src/pipeline'
import { map } from 'lodash/fp'

import { expect } from 'chai'

describe(`graphqlToFlow`, function() {
  it(`works`, async function(): Promise<void> {
    const query = `
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
    `

    const expected = `type ChannelFieldsData = {
    mqttTag: string,
    multiplier: ?number,
    offset: ?number,
};
type CreateDeviceMutationVariables = {
    organizationId: number,
    values: {
        name: string,
        type?: ?("MQTT"),
    },
};
type CreateDeviceMutationData = { device: { id: number } };
type CreateDeviceMutationFunction = MutationFunction<CreateDeviceMutationData, CreateDeviceMutationVariables>
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
            edges: ?Array<?{ node: { id: number } & ChannelFieldsData }>,
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
};`

    const actual = pipeline(
      (await graphqlToFlow({
        schemaFile: require.resolve('./schema.graphql'),
        query,
        external: new Map([['JSON', 'Object']]),
      })).statements,
      map(def => recast.print(def).code),
      arr => arr.join('\n')
    )

    expect(actual).to.equal(expected)
  })
  it(`external fragment works`, async function(): Promise<void> {
    const query = `
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
    `

    const expected = `type CreateDeviceMutationVariables = {
    organizationId: number,
    values: {
        name: string,
        type?: ?("MQTT"),
    },
};
type CreateDeviceMutationData = { device: { id: number } };
type CreateDeviceMutationFunction = MutationFunction<CreateDeviceMutationData, CreateDeviceMutationVariables>
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
            edges: ?Array<?{ node: { id: number } & ChannelFieldsData }>,
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
};`

    const actual = pipeline(
      (await graphqlToFlow({
        schemaFile: require.resolve('./schema.graphql'),
        query,
        external: new Map([
          ['JSON', 'Object'],
          ['channelFields', 'ChannelFieldsData'],
        ]),
      })).statements,
      map(def => recast.print(def).code),
      arr => arr.join('\n')
    )

    expect(actual).to.equal(expected)
  })
  it(`throws helpful error if the query includes a nonexistent field`, async function() {
    await expect(
      graphqlToFlow({
        schemaFile: require.resolve('./schema.graphql'),
        query: `fragment channelFields on MQTTDeviceChannel {
        mqttTag
        multiplier
        offset
        foo
      }`,
      })
    ).to.be.rejectedWith(
      Error,
      `type MQTTDeviceChannel doesn't have a field named foo.  Valid fields are:
  id
  deviceId
  channelGroupId
  direction
  type
  tag
  tagInDevice
  mqttTag
  enabled
  name
  multiplier
  offset
  MQTTDevice
  MetadataItem
  TagPrefixes`
    )
  })
  it(`can rename extracted fragment types`, async function() {
    const query = `
    fragment channelFields on MQTTDeviceChannel {
      mqttTag
      multiplier
      offset
    }
    `

    const expected = `type TestData = {
    mqttTag: string,
    multiplier: ?number,
    offset: ?number,
};`

    const actual = pipeline(
      (await graphqlToFlow({
        schemaFile: require.resolve('./schema.graphql'),
        query,
        external: new Map([['JSON', 'Object']]),
        extractTypes: new Map([['channelFields', 'TestData']]),
      })).statements,
      map(def => recast.print(def).code),
      arr => arr.join('\n')
    )

    expect(actual).to.equal(expected)
  })
})
