/**
 * @flow
 * @prettier
 */

 /* eslint-env node */

import {describe, it} from 'mocha'
import {expect} from 'chai'
import j from 'jscodeshift'
import setupMaterialUISystem from '../src/setupMaterialUISystem'

describe(`setupMaterialUISystem`, function () {
  it(`works when Box isn't already declared`, function () {
    const source = `
import * as React from 'react'
const Foo = () => <Box marginLeft={2} />
const Bar = () => <Box boxShadow={1} />
`
    const fileInfo = {
      path: __filename,
      source,
    }
    const api = {
      jscodeshift: j.withParser('babylon'),
      stats: (value: any) => {},
      report: process.stdout.write.bind(process.stdout),
    }
    const result = setupMaterialUISystem(fileInfo, api, {})
    expect(result).to.equal(`
import * as React from 'react'
import { styled } from "@material-ui/styles";
import { spacing, shadows, compose } from "@material-ui/system";
const Box = styled('div')(
  compose(shadows, spacing)
)
const Foo = () => <Box marginLeft={2} />
const Bar = () => <Box boxShadow={1} />
`)
  })
  it(`works when Box is already declared`, function () {
    const source = `
import * as React from 'react'
import { styled } from "@material-ui/styles";
import { shadows } from "@material-ui/system";
const Box = styled('div')(
  shadows
)
const Foo = () => <Box marginLeft={2} />
const Bar = () => <Box boxShadow={1} />
`
    const fileInfo = {
      path: __filename,
      source,
    }
    const api = {
      jscodeshift: j.withParser('babylon'),
      stats: (value: any) => {},
      report: process.stdout.write.bind(process.stdout),
    }
    const result = setupMaterialUISystem(fileInfo, api, {})
    expect(result).to.equal(`
import * as React from 'react'
import { styled } from "@material-ui/styles";
import { shadows, spacing, compose } from "@material-ui/system";
const Box = styled('div')(
  compose(shadows, spacing)
)
const Foo = () => <Box marginLeft={2} />
const Bar = () => <Box boxShadow={1} />
`)
  })
  it(`works when there's a single system function`, function () {
    const source = `
import * as React from 'react'
const Foo = () => <Box marginLeft={2} />
`
    const fileInfo = {
      path: __filename,
      source,
    }
    const api = {
      jscodeshift: j.withParser('babylon'),
      stats: (value: any) => {},
      report: process.stdout.write.bind(process.stdout),
    }
    const result = setupMaterialUISystem(fileInfo, api, {})
    expect(result).to.equal(`
import * as React from 'react'
import { styled } from "@material-ui/styles";
import { spacing } from "@material-ui/system";
const Box = styled('div')(
  spacing
)
const Foo = () => <Box marginLeft={2} />
`)
  })
  it(`removes unused system imports`, function () {
    const source = `
import * as React from 'react'
import { styled } from "@material-ui/styles";
import { spacing, shadows, compose } from "@material-ui/system";
const Box = styled('div')(
  spacing
)
const Foo = () => <Box marginLeft={2} />
`
    const fileInfo = {
      path: __filename,
      source,
    }
    const api = {
      jscodeshift: j.withParser('babylon'),
      stats: (value: any) => {},
      report: process.stdout.write.bind(process.stdout),
    }
    const result = setupMaterialUISystem(fileInfo, api, {})
    expect(result).to.equal(`
import * as React from 'react'
import { styled } from "@material-ui/styles";
import { spacing } from "@material-ui/system";
const Box = styled('div')(
  spacing
)
const Foo = () => <Box marginLeft={2} />
`)
  })
})
