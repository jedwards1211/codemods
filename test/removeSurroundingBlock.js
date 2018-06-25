// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import removeSurroundingBlock from '../src/removeSurroundingBlock'
import pathsToTransformFilter from '../src/pathsToTransformFilter'

const j = jscodeshift.withParser('babylon')

describe(`removeSurroundingBlock`, function () {
  it(`works with function`, function () {
    const code = `
function foo() {
  function bar() {
    function baz() {

    }
    function qux() {

    }
  }
  function qlob() {

  }
}
`

    const root = j(code)
    removeSurroundingBlock(root, pathsToTransformFilter(
      code.indexOf('function bar'), code.indexOf('function qlob')
    ))
    expect(root.toSource()).to.equal(`
function foo() {
  function baz() {

  }
  function qux() {

  }
  function qlob() {

  }
}
`)
  })
  it(`works with describe() block`, function () {
    const code = `
describe('foo', function foo() {
  describe('bar', () => {
    it('baz', () => {

    })
    it('qux', () => {

    })
  })
  it('qlob', function () {

  })
})
`

    let root = j(code)
    removeSurroundingBlock(root, pathsToTransformFilter(
      code.indexOf('it')
    ))
    expect(root.toSource()).to.equal(`
describe('foo', function foo() {
  it('baz', () => {

  })
  it('qux', () => {

  })
  it('qlob', function () {

  })
})
`)
    root = j(code)
    removeSurroundingBlock(root, pathsToTransformFilter(
      code.indexOf(`describe('bar'`)
    ))
    expect(root.toSource()).to.equal(`
describe('bar', () => {
  it('baz', () => {

  })
  it('qux', () => {

  })
})
it('qlob', function () {

})
`)
  })
  it(`works with lambda`, function () {
    const code = `
function foo() {
  const bar = () => {
    function baz() {

    }
    function qux() {

    }
  }
  function qlob() {

  }
}
`

    const root = j(code)
    removeSurroundingBlock(root, pathsToTransformFilter(
      code.indexOf('() => {') + 8,
      code.indexOf('() => {') + 8,
    ))
    expect(root.toSource()).to.equal(`
function foo() {
  function baz() {

  }
  function qux() {

  }
  function qlob() {

  }
}
`)
  })
})
