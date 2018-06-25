// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'
import switchToMonolithicLodash from '../src/switchToMonolithicLodash'

const jscodeshift = require('jscodeshift').withParser('babylon')

describe(`switchToMonolithicLodash`, function () {
  it(`works`, function () {
    const code = `
import mapValues from 'lodash.mapvalues'
import sort from 'lodash.sortby'
`
    expect(switchToMonolithicLodash({source: code}, {jscodeshift})).to.equal(`
import { mapValues, sortBy as sort } from "lodash";
`)
  })
})
