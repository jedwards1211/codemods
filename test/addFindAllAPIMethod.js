// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import jscodeshift from 'jscodeshift'
import addFindAllAPIMethod from '../src/addFindAllAPIMethod'

const j = jscodeshift.withParser('babylon')

describe(`addFindAllAPIMethod`, function () {
  it(`works`, function () {
    const code = `// @flow
import { reify } from "flow-runtime";
`
    const root = j(code)
    addFindAllAPIMethod(root, code.length, 'User')
    expect(root.toSource()).to.equal(`// @flow
// @flow-runtime enable
import { reify } from "flow-runtime";
import type { FindOptions } from "sequelize";
import User from "../models/User";
import type { Type } from "flow-runtime";
import { assert } from "./APIError";
export type FindAllUsersOptions = {
  +actorId: number,
}

export const FindAllUsersOptionsType = (reify: Type<FindAllUsersOptions>)

export async function assertCanFindAllUsers(options: FindAllUsersOptions): Promise<void> {
  assert(FindAllUsersOptionsType, options)
  const {actorId} = options
}

export async function getFindAllUsersQuery(options: FindAllUsersOptions): Promise<FindOptions<User>> {

}

export async function findAllUsers(options: FindAllUsersOptions): Promise<Array<User>> {
  await assertCanFindAllUsers(options)
  return await User.findAll(await getFindAllUsersQuery(options))
}
`)
  })
})
