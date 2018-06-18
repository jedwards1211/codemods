// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import addFindOneAPIMethod from '../src/addFindOneAPIMethod'

const j = jscodeshift.withParser('babylon')

describe(`addFindOneAPIMethod`, function () {
  it(`works`, function () {
    const code = `// @flow
import { reify } from "flow-runtime";
`
    const root = j(code)
    addFindOneAPIMethod(root, code.length, 'User')
    expect(root.toSource()).to.equal(`// @flow
// @flow-runtime enable
import { reify } from "flow-runtime";
import type { FindOptions } from "sequelize";
import User from "../models/User";
import type { Type } from "flow-runtime";
import { assert } from "./APIError";
export type FindOneUserOptions = {
  +actorId: number,
}

export const FindOneUserOptionsType = (reify: Type<FindOneUserOptions>)

export async function assertCanFindOneUser(options: FindOneUserOptions): Promise<void> {
  assert(FindOneUserOptionsType, options)
  const {actorId} = options
}

export async function getFindOneUserQuery(options: FindOneUserOptions): Promise<FindOptions<User>> {

}

export async function findOneUser(options: FindOneUserOptions): Promise<?User> {
  await assertCanFindOneUser(options)
  return await User.findOne(await getFindOneUserQuery(options))
}
`)
  })
})
