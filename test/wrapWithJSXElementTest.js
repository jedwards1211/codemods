// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'

const j = require('jscodeshift').withParser('babylon')

import wrapWithJSXElement from '../src/wrapWithJSXElement'
import pathsToTransformFilter from '../src/pathsToTransformFilter'

describe(`wrapWithJSXElement`, function() {
  it(`works for children`, function() {
    const code = `
const Comp = () => (
  <div>
    {foo}
    {bar}
    <span />
    {baz}
  </div>
)
`
    const root = j(code)

    wrapWithJSXElement({
      root,
      filter: pathsToTransformFilter(
        code.indexOf('{foo}'),
        code.indexOf('{baz}')
      ),
      name: 'Test',
    })

    expect(root.toSource()).to.equal(`
const Comp = () => (
  <div>
    <Test>
      {foo}
      {bar}
      <span />
    </Test>
    {baz}
  </div>
)
`)
  })
  it(`works for root element`, function() {
    const code = `
const Comp = () => (
  <div>
    {foo}
    {bar}
    <span />
    {baz}
  </div>
)
`
    const root = j(code)

    wrapWithJSXElement({
      root,
      filter: pathsToTransformFilter(code.indexOf('<div>')),
      name: 'Test',
    })

    expect(root.toSource()).to.equal(`
const Comp = () => (
  <Test>
    <div>
      {foo}
      {bar}
      <span />
      {baz}
    </div>
  </Test>
)
`)
  })
})
