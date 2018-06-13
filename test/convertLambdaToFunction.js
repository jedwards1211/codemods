// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import convertLambdaToFunction from '../src/convertLambdaToFunction'

const j = jscodeshift.withParser('babylon')

describe(`convertLambdaToFunction`, function () {
  it(`works`, function () {
    const root = j(`
props => <div />
const bar = props => (
  <div>
    Foo
  </div>
);
const baz = <T>(props: Props<T>): T => {
  return props
}
`)
    convertLambdaToFunction(root.find(j.ArrowFunctionExpression))
    expect(root.toSource()).to.equal(`
(function(props) {
  return <div />;
})
function bar(props) {
  return (
    <div>
      Foo
    </div>
  );
};
function baz<T>(props: Props<T>): T {
  return props
}
`
    )
  })
})
