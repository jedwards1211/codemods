// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import convertLambdaToSimple from '../src/convertLambdaToSimple'

const j = jscodeshift.withParser('babylon')

describe(`convertLambdaToSimple`, function () {
  it(`works`, function () {
    const root = j(`
props => {
  return <div />;
}
props => {
  return (
    <div>
      Foo
    </div>
  )
}
props => {
  return {foo: 'bar'}
}
`)
    convertLambdaToSimple(root.find(j.ArrowFunctionExpression))
    expect(root.toSource()).to.equal(`
props => <div />
props => <div>
  Foo
</div>
props => ({
  foo: 'bar'
})
`)
  })
})
