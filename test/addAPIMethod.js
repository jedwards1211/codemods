// @flow

import { describe, it } from 'mocha'
import { expect } from 'chai'

import jscodeshift from 'jscodeshift'
import addAPIMethod from '../src/addAPIMethod'

const j = jscodeshift.withParser('babylon')

describe(`addAPIMethod`, function() {
  it(`works`, function() {
    const code = `// @flow
import { reify } from "flow-runtime";
`
    const root = j(code)
    addAPIMethod(root, code.length, {
      file: __filename,
      name: 'createUser',
      returnType: 'User',
    })
    expect(root.toSource()).to.equal(`// @flow
// @flow-runtime enable
import { reify, type Type } from "flow-runtime";
import { assert } from "../src/server/api/APIError";
import APIContext from "../src/server/api/APIContext";
export type CreateUserOptions = {
  +apiContext: APIContext<any>,
  
}

export const CreateUserOptionsType = (reify: Type<CreateUserOptions>)

export async function createUser(options: CreateUserOptions): Promise<User> {
  assert(CreateUserOptionsType, options)
  const {apiContext} = options
  const {transaction} = apiContext
}
`)
  })
})
