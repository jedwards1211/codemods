// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import getSchemaTypes from '../src/getSchemaTypes'

describe(`getSchemaTypes`, function () {
  it(`works`, async function (): Promise<void> {
    const types = await getSchemaTypes('http://localhost:3000/graphql')
    console.log(types)
  })
})
