// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import addAPIMethod from '../src/addAPIMethod'

const j = jscodeshift.withParser('babylon')

describe(`addAPIMethod`, function () {
  it(`works`, function () {
    const code = `// @flow
import { reify } from "flow-runtime";
`
    const root = j(code)
    addAPIMethod(root, code.length, 'CreateUser')
    expect(root.toSource()).to.equal(`// @flow
// @flow-runtime enable
import { reify, assert } from "flow-runtime";
import type { Type } from "flow-runtime";
export type CreateUserOptions = {
  +actorId: number,
}

export const CreateUserOptionsType = (reify: Type<CreateUserOptions>)

export async function assertCanCreateUser(options: CreateUserOptions): Promise<void> {
  assert(CreateUserOptionsType, options)
  const {actorId} = options
}

export async function createUser(options: CreateUserOptions): Promise<RETURN_TYPE> {
  await assertCanCreateUser(options)
}
`)
  })
})
