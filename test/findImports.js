// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'
import jscodeshift from 'jscodeshift'

import findImports from '../src/findImports'

const j = jscodeshift.withParser('babylon')
const {statement} = j.template

describe(`findImports`, function () {
  describe(`for require statement`, function () {
    it(`throws if statement contains a non-require declarator`, function () {
      const code = `import Baz from 'baz'`
      expect(() =>
        findImports(j(code), statement`const foo = require('baz'), bar = invalid(true)`)
      ).to.throw(Error)
    })
    it(`works for non-default imports with alias`, function () {
      const code = `import {foo as bar} from 'baz'`
      expect(findImports(j(code), statement`const {foo: qux} = require('baz')`)).to.deep.equal({
        qux: 'bar'
      })
    })
    it(`works for non-default imports without alias`, function () {
      const code = `import {foo} from 'baz'`
      expect(findImports(j(code), statement`const {foo: qux} = require('baz')`)).to.deep.equal({
        qux: 'foo'
      })
    })
    it(`works for default requires`, function () {
      const code = `const foo = require('baz')`
      expect(findImports(j(code), statement`const qux = require('baz')`)).to.deep.equal({
        qux: 'foo'
      })
    })
  })
  describe(`for import statement`, function () {
    it(`works for default imports`, function () {
      const code = `import Baz from 'baz'`
      const result = findImports(j(code), statement`import Foo from 'baz'`)
      expect(result).to.deep.equal({
        Foo: 'Baz',
      })
    })
    it(`works for funky default imports`, function () {
      const code = `import {default as Baz} from 'baz'`
      const result = findImports(j(code), statement`import {default as Foo} from 'baz'`)
      expect(result).to.deep.equal({
        Foo: 'Baz',
      })
    })
    it(`works for non-default import specifiers with aliases`, function () {
      const code = `import {foo as bar} from 'baz'`
      const result = findImports(j(code), statement`import {foo as qux} from 'baz'`)
      expect(result).to.deep.equal({
        qux: 'bar',
      })
    })
    it(`works for non-default import type specifiers with aliases`, function () {
      const code = `
import {foo as bar} from 'baz'
import type {foo as qlob} from 'baz'`
      const result = findImports(j(code), statement`import type {foo as qux} from 'baz'`)
      expect(result).to.deep.equal({
        qux: 'qlob',
      })
    })
    it(`works for non-default import specifiers without aliases`, function () {
      const code = `import {foo} from 'baz'`
      const result = findImports(j(code), statement`import {foo} from 'baz'`)
      expect(result).to.deep.equal({
        foo: 'foo',
      })
    })
    it(`works for non-default require specifiers with aliases`, function () {
      const code = `const {foo: bar} = require('baz')`
      const result = findImports(j(code), statement`import {foo} from 'baz'`)
      expect(result).to.deep.equal({
        foo: 'bar',
      })
    })
    it(`works for namespace imports`, function () {
      const code = `import * as React from 'react'`
      const result = findImports(j(code), statement`import * as R from 'react'`)
      expect(result).to.deep.equal({
        R: 'React',
      })
    })
    it(`works for require defaults with commonjs: false`, function () {
      const code = `const bar = require('foo').default`
      const result = findImports(j(code), statement`import foo from 'foo'`)
      expect(result).to.deep.equal({
        foo: 'bar',
      })
    })
    it(`works for destructured require defaults with commonjs: false`, function () {
      const code = `const {default: bar} = require('foo')`
      const result = findImports(j(code), statement`import foo from 'foo'`)
      expect(result).to.deep.equal({
        foo: 'bar',
      })
    })
    it(`works for require defaults with commonjs: true`, function () {
      const code = `const bar = require('foo')`
      const result = findImports(j(code), statement`import foo from 'foo'`, {commonjs: true})
      expect(result).to.deep.equal({
        foo: 'bar',
      })
    })
  })
})
