/**
 * @flow
 * @prettier
 */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import requireGlob from 'require-glob'
import jscodeshift from 'jscodeshift'
import addStyles from '../../src/addStyles'
import pathsToTransformFilter from '../../src/pathsToTransformFilter'

describe(`addStyles`, function() {
  const fixtures = requireGlob.sync('./fixtures/*.js')
  for (const key in fixtures) {
    const { input, output, parser, file } = fixtures[key]
    const j = jscodeshift.withParser(parser || 'babylon')
    const position = input.indexOf('// position')
    it(key.replace(/\.js$/, ''), function() {
      const root = j(input.replace(/^\s*\/\/\s*position.*(\r\n?|\n)/gm, ''))
      addStyles(root, pathsToTransformFilter(position), {
        file: file || __filename,
      })
      expect(root.toSource().trim()).to.equal(output.trim())
    })
  }
})
