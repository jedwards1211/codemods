/**
 * @flow
 * @prettier
 */

import {describe, it} from 'mocha'
import {expect} from 'chai'
import j from 'jscodeshift'
import inlineClassesType from '../src/inlineClassesType'

const jscodeshift = j.withParser(inlineClassesType.parser)

describe(`inlineClassesType`, function () {
  it(`works`, function () {
    const code = `
// @flow

import type {Classes} from 'material-ui-render-props-styles'
import type {Theme} from '../theme'

const styles = ({spacing}: Theme) => ({
  root: {
  }
})
const styles2 = {
  foo: {
  }
}

export type Props = {
  classes?: $Shape<Classes<typeof styles>>,
  classes2?: $Shape<Classes<typeof styles2>>,
}
    `

    expect(inlineClassesType({source: code}, {jscodeshift})).to.equal(`
// @flow

type ObjClasses<Styles> = { [$Keys<Styles>]: string };
type FnClasses<Styles> = $Call<
  <T>((any) => T) => { [$Keys<T>]: string },
  Styles
>
import type {Theme} from '../theme'

const styles = ({spacing}: Theme) => ({
  root: {
  }
})
const styles2 = {
  foo: {
  }
}

export type Props = {
  classes?: $Shape<FnClasses<typeof styles>>,
  classes2?: $Shape<ObjClasses<typeof styles2>>,
}
    `)
  })
})
