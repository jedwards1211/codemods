// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'

import wrapWithTryCatch from '../src/morpher-transforms/wrapWithTryCatch'
import morpherUtils from './test-morpher-utils'

describe(`wrapWithTryCatch`, function() {
  it(`works for children`, function() {
    const code = `
const foo = 'foo'
const bar = 'bar'
if (foo) {
  console.log(bar)
}
const baz = 'baz'
const qux = 'qux'
`

    const { text: transformed } = morpherUtils({ activeFile: 'foo.js' }).apply(
      wrapWithTryCatch,
      {
        text: code,
        selection: {
          start: { row: 2, column: 0 },
          end: { row: 7, column: 0 },
        },
      }
    )

    expect(transformed).to.equal(`
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
