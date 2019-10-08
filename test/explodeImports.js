// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'

import jscodeshift from 'jscodeshift'
import explodeImports from '../src/explodeImports'

const j = jscodeshift.withParser('babylon')

describe(`explodeImports`, function() {
  it(`works for values`, function() {
    const root = j(`
import Rubix, {Grid as _Grid, Row, Col} from '@jcoreio/rubix'
`)

    explodeImports(root, '@jcoreio/rubix')

    expect(root.toSource()).to.equal(`
import Rubix from '@jcoreio/rubix';
import _Grid from "@jcoreio/rubix/Grid";
import Row from "@jcoreio/rubix/Row";
import Col from "@jcoreio/rubix/Col";
`)
  })
  it(`works for types`, function() {
    const root = j(`
import type Rubix, {Grid as _Grid, Row, Col} from '@jcoreio/rubix'
`)

    explodeImports(root, '@jcoreio/rubix')

    expect(root.toSource()).to.equal(`
import type Rubix from '@jcoreio/rubix';
import type _Grid from "@jcoreio/rubix/Grid";
import type Row from "@jcoreio/rubix/Row";
import type Col from "@jcoreio/rubix/Col";
`)
  })
})
