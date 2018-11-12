// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'
import switchToSpecifiedLodashImports from '../src/switchToSpecifiedLodashImports'

const jscodeshift = require('jscodeshift').withParser('babylon')

describe(`switchToSpecifiedLodashImports`, function () {
  it(`works`, function () {
    const code = `
import mapValues from 'lodash/mapValues'
import sort from 'lodash/sortBy'
`
    expect(switchToSpecifiedLodashImports({source: code}, {jscodeshift})).to.equal(`
import { mapValues, sortBy as sort } from "lodash";
`)
  })
})
