// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

const j = require('jscodeshift').withParser('babylon')

import wrapWithTryCatch from '../src/wrapWithTryCatch'
import pathsToTransformFilter from '../src/pathsToTransformFilter'

describe(`wrapWithTryCatch`, function () {
  it(`works for children`, function () {
    const code = `
const foo = 'foo'
const bar = 'bar'
if (foo) {
  console.log(bar)
}
const baz = 'baz'
const qux = 'qux'
`
    const root = j(code)

    wrapWithTryCatch({
      root,
      filter: pathsToTransformFilter(
        code.indexOf('const bar'),
        code.indexOf('const qux')
      ),
    })

    expect(root.toSource()).to.equal(`
const foo = 'foo'

try {
  const bar = 'bar'
  if (foo) {
    console.log(bar)
  }
  const baz = 'baz'
} catch (error) {
}

const qux = 'qux'
`)
  })
})
