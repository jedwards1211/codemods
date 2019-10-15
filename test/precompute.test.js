/**
 * @flow
 * @prettier
 */

const { describe, it } = require('mocha')
const { expect } = require('chai')
const j = require('jscodeshift').withParser('babylon')

const precomputeExpression = require('../src/precompute/precomputeExpression')

describe(`precompute`, function() {
  it(`resolves Identifiers`, function() {
    expect(
      precomputeExpression(
        j(`
        const foo = 2
        const bar = foo
        `)
          .find(j.Identifier, { name: 'bar' })
          .paths()[0]
      )
    ).to.equal(2)
  })
  it(`handles StringLiterals`, function() {
    expect(
      precomputeExpression(
        j(`
        const foo = 'bar'
        `)
          .find(j.Identifier, { name: 'foo' })
          .paths()[0]
      )
    ).to.equal('bar')
  })
  it(`handles NullLiterals`, function() {
    expect(
      precomputeExpression(
        j(`
        const foo = null
        `)
          .find(j.Identifier, { name: 'foo' })
          .paths()[0]
      )
    ).to.equal(null)
  })
  it(`handles TemplateLiterals`, function() {
    expect(
      precomputeExpression(
        j(`
        const bar = 'bar'
        const qux = \`3 \${bar}\`
        const foo = \`hello \${bar} baz \${qux}\`
        `)
          .find(j.Identifier, { name: 'foo' })
          .paths()[0]
      )
    ).to.equal('hello bar baz 3 bar')
  })
})
