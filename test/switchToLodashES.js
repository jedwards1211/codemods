// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'
import switchToLodashES from '../src/switchToLodashES'

const jscodeshift = require('jscodeshift').withParser('babylon')

describe(`switchToLodashES`, function() {
  it(`works`, function() {
    const code = `
import mapValues from 'lodash.mapvalues'
import {sort as _sort, map} from 'lodash'
`
    expect(switchToLodashES({ source: code }, { jscodeshift })).to.equal(`
import mapValues from "lodash-es/mapValues"
import _sort from 'lodash-es/sort'
import map from 'lodash-es/map'
`)
  })
})
