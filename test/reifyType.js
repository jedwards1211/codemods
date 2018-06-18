// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import reifyType from '../src/reifyType'

const j = jscodeshift.withParser('babylon')

describe(`reifyType`, function () {
  it(`works`, function () {
    const code = `// @flow

export type Foo = number | string
// insertion point
`
    const root = j(code)
    reifyType(root, code.indexOf('// insertion point'), 'Foo')
    expect(root.toSource()).to.equal(`// @flow
// @flow-runtime enable
import { reify } from "flow-runtime";

import type { Type } from "flow-runtime";

export type Foo = number | string;
export const FooType = (reify: Type<Foo>)
`)
  })
})
