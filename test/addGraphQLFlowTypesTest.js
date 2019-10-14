// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'

import addGraphQLFlowTypes from '../src/addGraphQLFlowTypes'

describe(`addGraphQLFlowTypes`, function() {
  it(`works`, async function(): Promise<void> {
    const code = `
import {Query, Mutation} from 'react-apollo'
import gql from 'graphql-tag'

// @graphql-to-flow ignore
const ignoredQuery = gql\`
query {
  currentUser
}
\`

// @graphql-to-flow extract-types: MQTTDeviceChannel = MQTTDeviceChannelData, DeviceDirection
// @graphql-to-flow scalar: JSON = Object
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

    expect(root.toSource().trim()).to
      .equal(`import { Query, Mutation, type MutationFunction, type QueryRenderProps } from 'react-apollo';
import gql from 'graphql-tag'

// @graphql-to-flow ignore
const ignoredQuery = gql\`
query {
  currentUser
}
\`

// @graphql-to-flow extract-types: MQTTDeviceChannel = MQTTDeviceChannelData, DeviceDirection
// @graphql-to-flow scalar: JSON = Object
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
/* eslint-disable no-unused-vars */
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
      edges: ?Array<?{ node: MQTTDeviceChannelData }>,
    },
    TagPrefixes: {
      id: number,
      deviceTagPrefix: string,
    },
  },
  MQTTDeviceChannel: ?MQTTDeviceChannelData1,
};

// @graphql-to-flow auto-generated
type MQTTDeviceChannelData1 = {
  id: number,
  mqttTag: string,
};

// @graphql-to-flow auto-generated
type MQTTDeviceChannelData = { id: number } & ChannelFieldsData;

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

/* eslint-enable no-unused-vars */
const mutation = gql\`
mutation createDevice($organizationId: Int!, $values: CreateDevice!) {
  device: createDevice(organizationId: $organizationId, value: $values) {
    id
  }
}
\`;

// @graphql-to-flow auto-generated
/* eslint-disable no-unused-vars */
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

/* eslint-enable no-unused-vars */
const ViewContainer = () => (
  <Mutation mutation={mutation}>
    {(createDevice: CreateDeviceMutationFunction) => (
      <Query
        query={query}
        variables={({baz: 'qux'}: GetStuffQueryVariables)}
      >
        {(data: QueryRenderProps<GetStuffQueryData, GetStuffQueryVariables>) => (
          <div />
        )}
      </Query>
    )}
  </Mutation>
);`)
  })
  it(`adds types to useQuery hooks`, async function() {
    const code = `// @flow
import {useQuery} from 'react-apollo'
import gql from 'graphql-tag'

const query = gql\`
query getStuff($userId: Int!) {
  User(id: $userId) {
    name
  }
}
\`

const View = () => {
  const {data} = useQuery(query, {
    variables: {userId: 1}
  })
  return <div />
}
`

    const root = await addGraphQLFlowTypes({
      code,
      schemaFile: require.resolve('./schema.graphql'),
    })

    expect(root.toSource().trim()).to.equal(`// @flow
import { useQuery, type QueryRenderProps } from 'react-apollo';
import gql from 'graphql-tag'

const query = gql\`
query getStuff($userId: Int!) {
  User(id: $userId) {
    name
  }
}
\`

// @graphql-to-flow auto-generated
/* eslint-disable no-unused-vars */
type GetStuffQueryData = { User: ?{ name: ?string } };

// @graphql-to-flow auto-generated
type GetStuffQueryVariables = { userId: number };

/* eslint-enable no-unused-vars */
const View = () => {
  const {
    data
  }: QueryRenderProps<GetStuffQueryData, GetStuffQueryVariables> = useQuery(query, {
    variables: ({userId: 1}: GetStuffQueryVariables)
  })
  return <div />
};`)
  })
  it(`leaves everything generated for useQuery hooks intact`, async function() {
    const code = `// @flow
import { useQuery, type QueryRenderProps } from 'react-apollo';
import gql from 'graphql-tag'

const query = gql\`
query getStuff($userId: Int!) {
  User(id: $userId) {
    name
  }
}
\`

// @graphql-to-flow auto-generated
/* eslint-disable no-unused-vars */
type GetStuffQueryData = { User: ?{ name: ?string } };

// @graphql-to-flow auto-generated
type GetStuffQueryVariables = { userId: number };

/* eslint-enable no-unused-vars */
const View = () => {
  const {
    data
  }: QueryRenderProps<GetStuffQueryData, GetStuffQueryVariables> = useQuery(query, {
    variables: ({userId: 1}: GetStuffQueryVariables)
  })
  return <div />
};
`

    const root = await addGraphQLFlowTypes({
      code,
      schemaFile: require.resolve('./schema.graphql'),
    })

    expect(root.toSource().trim()).to.equal(`// @flow
import { useQuery, type QueryRenderProps } from 'react-apollo';
import gql from 'graphql-tag'

const query = gql\`
query getStuff($userId: Int!) {
  User(id: $userId) {
    name
  }
}
\`

// @graphql-to-flow auto-generated
/* eslint-disable no-unused-vars */
type GetStuffQueryData = { User: ?{ name: ?string } };

// @graphql-to-flow auto-generated
type GetStuffQueryVariables = { userId: number };

/* eslint-enable no-unused-vars */
const View = () => {
  const {
    data
  }: QueryRenderProps<GetStuffQueryData, GetStuffQueryVariables> = useQuery(query, {
    variables: ({userId: 1}: GetStuffQueryVariables)
  })
  return <div />
};`)
  })
  it.skip(`adds types to useMutation hooks`, async function() {
    const code = `// @flow
import {useMutation} from 'react-apollo'
import gql from 'graphql-tag'

const mutation = gql\`
mutation createUser($values: CreateUser!) {
  createUser(values: $values) {
    id
    name
  }
}
\`

const View = () => {
  const [createUser] = useMutation(mutation)
  return <div />
}
`

    const root = await addGraphQLFlowTypes({
      code,
      schemaFile: require.resolve('./schema.graphql'),
    })

    expect(root.toSource().trim()).to.equal(`// @flow
import { useMutation, type MutationFunction } from 'react-apollo';
import gql from 'graphql-tag'

const mutation = gql\`
mutation createUser($values: CreateUser!) {
  createUser(values: $values) {
    id
    name
  }
}
\`

// @graphql-to-flow auto-generated
/* eslint-disable no-unused-vars */
type CreateUserMutationFunction = MutationFunction<CreateUserMutationData, CreateUserMutationVariables>;

// @graphql-to-flow auto-generated
type CreateUserMutationData = { createUser: {
  id: number,
  name: ?string,
} };

// @graphql-to-flow auto-generated
type CreateUserMutationVariables = { values: {
  name?: ?string,
  username: string,
} };

/* eslint-enable no-unused-vars */
const View = () => {
  const [createUser]: [CreateUserMutationFunction] = useMutation(mutation)
  return <div />
};`)
  })
  it(`adds types to useSubscription hooks`, async function() {
    const code = `// @flow
import {useSubscription} from 'react-apollo'
import gql from 'graphql-tag'

const subscription = gql\`
subscription tagState($tag: String!) {
  TagState(tag: $tag) {
    tag
    v
  }
}
\`

const View = () => {
  const {loading, data} = useSubscription(subscription, {
    variables: {tag: 'foo'}
  })
  return <div />
}
`

    const root = await addGraphQLFlowTypes({
      code,
      schemaFile: require.resolve('./schema.graphql'),
    })

    expect(root.toSource().trim()).to.equal(`// @flow
import { useSubscription, type SubscriptionResult } from 'react-apollo';
import gql from 'graphql-tag'

const subscription = gql\`
subscription tagState($tag: String!) {
  TagState(tag: $tag) {
    tag
    v
  }
}
\`

// @graphql-to-flow auto-generated
/* eslint-disable no-unused-vars */
type TagStateSubscriptionData = { TagState: ?{
  tag: string,
  v: ?mixed,
} };

// @graphql-to-flow auto-generated
type TagStateSubscriptionVariables = { tag: string };

/* eslint-enable no-unused-vars */
const View = () => {
  const {
    loading,
    data
  }: SubscriptionResult<TagStateSubscriptionData, TagStateSubscriptionVariables> = useSubscription(subscription, {
    variables: ({tag: 'foo'}: TagStateSubscriptionVariables)
  })
  return <div />
};`)
  })
})
