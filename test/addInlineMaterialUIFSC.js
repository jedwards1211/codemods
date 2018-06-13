// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import addInlineMaterialUIFSC from '../src/addInlineMaterialUIFSC'

describe(`addInlineMaterialUIFSC`, function () {
  it(`works`, function () {
    const code = `
import * as React from 'react'
import type {Classes} from 'material-ui-render-props-styles'

const Foo = () => 'bar'
`
    const result = addInlineMaterialUIFSC({code, file: __filename, name: 'Bar', position: code.indexOf('const Foo')})

    expect(result).to.equal(`
import * as React from 'react'
import type {Classes} from 'material-ui-render-props-styles'

import createStyled from "material-ui-render-props-styles";
import type { Theme } from "../src/universal/theme";

const barStyles = (theme: Theme) => ({
  root: {
  },
})

type BarProps = {
  +classes?: Shape<typeof barStyles>,
}

const BarStyles = createStyled(barStyles, {name: 'Bar'})

const Bar = ({classes}: BarProps): React.Node => (
  <BarStyles classes={classes}>
    {({classes}) => (
      <div className={classes.root} />
    )}
  </BarStyles>
)
const Foo = () => 'bar'
`)
  })
})
