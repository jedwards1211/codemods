// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import convertFSCToComponent from '../src/convertFSCToComponent'

const j = jscodeshift.withParser('babylon')

describe(`convertFSCToComponent`, function () {
  it(`works`, function () {
    const root = j(`
const Foo = <T>({className}: Props<T>): React.Node => {
  const blah = () => 2
  return <div className={className} />
}
function Bar<T>({className}: Props<T>): React.Node {
  return <div className={className} />
}
const foo = () => 2,
      bar = () => 3
const baz = () => (
  <button>
    baz
  </button>
);
() => <div />
`)

    convertFSCToComponent(root)

    console.log(root.toSource())
  })
})
