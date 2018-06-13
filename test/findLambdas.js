// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'
import jscodeshift from 'jscodeshift'

const j = jscodeshift.withParser('babylon')

describe(`findLambdas`, function () {
  it(`works`, function () {
    const root = j(`
const Foo = props => (
  <div>
  	foo
  </div>
)

const Bar = props =>
  <div>
  	foo
  </div>

const middleware = store => next => action => {
  next(action)
}
`)

    root.find(j.ArrowFunctionExpression).forEach(path => {
      console.log(path.node.start)
    })
    const lambdas = root.find(j.ArrowFunctionExpression).filter(path =>
      path.node.start > 100 && path.node.end < 130
    )

    console.log(lambdas.toSource())
  })
})
