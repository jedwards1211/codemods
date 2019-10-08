// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'
import jscodeshift from 'jscodeshift'

import insertProgramStatement from '../src/insertProgramStatement'

const j = jscodeshift.withParser('babylon')
const { statement } = j.template

describe(`insertProgramStatement`, function() {
  it(`inserts after initial comments when there are no statements`, function() {
    const code = `// @flow
// @flow-runtime enable`
    const root = j(code)
    insertProgramStatement(root, 0, statement`const baz = require('baz')`)
    expect(root.toSource()).to.equal(`${code}
const baz = require('baz');`)
  })

  it(`inserts after initial comments when there are statements`, function() {
    const code = `// @flow
// @flow-runtime enable
const foo = require('foo')`
    const root = j(code)
    insertProgramStatement(root, 0, statement`const baz = require('baz')`)
    expect(root.toSource()).to.equal(`// @flow
// @flow-runtime enable
const baz = require('baz');

const foo = require('foo');`)
  })
})
