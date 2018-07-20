// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'
import recast from 'recast'

import graphqlToFlow from '../src/graphqlToFlow'

const server = 'http://localhost:3000/graphql'

describe(`graphqlToFlow`, function () {
  it(`works`, async function (): Promise<void> {
    const query = `
    fragment channelFields on MQTTDeviceChannel {
      mqttTag
      multiplier
      offset
    }
    query ($userGroupId: Int!, $id: Int!) {
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

    for (let def of await graphqlToFlow({server, query})) {
      console.log(recast.print(def).code)
    }
  })
})
