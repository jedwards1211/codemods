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

    expect(root.toSource()).to.equal(`
class Foo<T> extends React.Component<Props<T>> {
  render(): React.Node {
    const {className}: Props<T> = this.props;
    const blah = () => 2
    return <div className={className} />
  }
}

class Bar<T> extends React.Component<Props<T>> {
  render(): React.Node {
    const {className}: Props<T> = this.props;
    return <div className={className} />
  }
}

const foo = () => 2,
      bar = () => 3

class baz extends React.Component {
  render() {
    return (
      <button>
        baz
      </button>
    );
  }
}

class extends React.Component {
  render() {
    return <div />;
  }
};
`)
  })
})
