// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'
import closestProgramStatement from '../src/closestProgramStatement'
import jscodeshift from 'jscodeshift'

const j = jscodeshift.withParser('babylon')

describe(`closestProgramStatement`, function() {
  const code = `
const foo = () => {
  var toink
  const bar = () => {
    var blearck
  }
  var halb
  const baz = () => {
    var qlomb
    const blargh = () => {
      var gloob
    }
    var flamb
  }
  var nelm
  const qux = () => {

  }
}
var fildge
const qlob = () => {

}
var qlarmge
`

  it(`if any path are fully contained in the range, returns only the outermost ones`, function() {
    const decl = j(code).find(j.VariableDeclarator, { id: { name: 'qlomb' } })
    const statementPath = closestProgramStatement(decl.paths()[0])
    expect(statementPath.value.start).to.equal(code.indexOf('const foo'))
  })
})
