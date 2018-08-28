// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'
const j = require('jscodeshift').withParser('babylon')

import fixApolloUpdateFn from '../src/fixApolloUpdateFn'
import pathsToTransformFilter from '../src/pathsToTransformFilter'

describe(`fixApolloUpdateFn`, function () {
  it(`works`, function () {
    const code = `
<Mutation
  update={(cache, {data: {removeUsersFromDevice, removeUsersFromDeviceGroup}}) =>
    refetch(client, [
      ['User', userId],
      removeUsersFromDevice
        ? ['Device', removeUsersFromDevice.deviceId]
        : ['DeviceGroup', removeUsersFromDeviceGroup.deviceGroupId],
    ])
  }
/>
    `

    const root = j(code)

    fixApolloUpdateFn({root, filter: pathsToTransformFilter(code.indexOf('{data'))})

    console.log(root.toSource())
  })
})
