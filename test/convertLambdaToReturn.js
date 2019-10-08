// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'

import jscodeshift from 'jscodeshift'
import convertLambdaToReturn from '../src/convertLambdaToReturn'

const j = jscodeshift.withParser('babylon')

describe(`convertLambdaToReturn`, function() {
  it(`works`, function() {
    const root = j(`
props => <div />
props => (
  <div>
    Foo
  </div>
)
    `)
    convertLambdaToReturn(root.find(j.ArrowFunctionExpression))
    expect(root.toSource()).to.equal(`
props => {
  return <div />;
}
props => {
  return (
    <div>
      Foo
    </div>
  );
}
    `)
  })
})
