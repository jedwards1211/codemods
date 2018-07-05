// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import convertStringPropToTemplate from '../src/convertStringPropToTemplate'
import pathsToTransformFilter from '../src/pathsToTransformFilter'

const j = jscodeshift.withParser('babylon')

describe(`convertStringPropToTemplate`, function () {
  it(`works`, function () {
    const code = `
const foo = (
  <Field
    name="automaticallyDetectAndAddTags"
    component={Checkbox}
    color="primary"
  />
)
    `
    const root = j(code)
    convertStringPropToTemplate(root, pathsToTransformFilter(code.indexOf('automatically')))
    expect(root.toSource()).to.equal(`
const foo = (
  <Field
    name={\`automaticallyDetectAndAddTags\`}
    component={Checkbox}
    color="primary"
  />
)
    `)
  })
})
