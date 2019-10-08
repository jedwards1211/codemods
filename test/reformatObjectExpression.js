// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'

import jscodeshift from 'jscodeshift'
import reformat from '../src/reformat'

const j = jscodeshift.withParser('babylon')

describe(`reformat`, function() {
  it(`works for ObjectExpressions`, function() {
    const root = j(`
const foo = {a: 1, b: 2}
    `)
    reformat(root.find(j.ObjectExpression))
    expect(root.toSource()).to.equal(`
const foo = {
  a: 1,
  b: 2
}
    `)
  })
  it(`works for ObjectTypeAnnotations`, function() {
    const root = j(`
type foo = {a: number, b: string}
    `)
    reformat(root.find(j.ObjectTypeAnnotation))
    expect(root.toSource()).to.equal(`
type foo = {
  a: number,
  b: string,
}
    `)
  })
})
