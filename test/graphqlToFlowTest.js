// @flow

import {describe, it} from 'mocha'
import recast from 'recast'

import graphqlToFlow from '../src/graphqlToFlow'

describe(`graphqlToFlow`, function () {
  it(`works`, async function (): Promise<void> {
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

    for (let def of await graphqlToFlow({
      schemaFile: require.resolve('./schema.graphql'),
      query,
    })) {
      console.log(recast.print(def).code) // eslint-disable-line no-console
    }
  })
})
