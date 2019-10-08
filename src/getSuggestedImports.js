const fs = require('fs-extra')
const pick = require('lodash/pick')
const path = require('path')
const j = require('jscodeshift').withParser('babylon')
const memoize = require('lodash/memoize')

async function exists(file) {
  try {
    return (await fs.stat(file)).isFile()
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

const getSuggestedImportsForDir = memoize(async function(dir) {
  const parentDir = path.dirname(dir)
  const parentDirSuggestions =
    parentDir && parentDir !== dir
      ? await getSuggestedImportsForDir(path.dirname(dir))
      : {}
  const result = {
    suggestedImports: new Map(parentDirSuggestions.suggestedImports || []),
    ignore: parentDirSuggestions.ignore ? [...parentDirSuggestions.ignore] : [],
  }
  const configFile = path.join(dir, '.suggestedImports.js')
  if (!(await exists(configFile))) return result
  const configure = require(configFile)
  const { suggestedImports, ignore } = await configure({ jscodeshift: j })
  if (ignore) result.ignore.unshift(...ignore)
  if (suggestedImports) {
    for (let i = suggestedImports.length - 1; i >= 0; i--) {
      const statement = suggestedImports[i]
      if (typeof statement === 'string') {
        let parsed = []
        try {
          parsed = j(statement)
            .find(j.ImportDeclaration)
            .nodes()
        } catch (error) {
          /* eslint-disable no-console */
          console.error(
            `Invalid import statement in: ${statement}`,
            error.stack
          )
          /* eslint-enable no-console */
        }
        suggestedImports.splice(i, 1, ...parsed)
      }
    }
    for (let i = suggestedImports.length - 1; i >= 0; i--) {
      const { type, specifiers, importKind, source } = suggestedImports[i]
      for (let specifier of specifiers) {
        const {
          local: { name },
        } = specifier
        let importsForName = result.suggestedImports.get(name)
        if (!importsForName) {
          importsForName = []
          result.suggestedImports.set(name, importsForName)
        }
        importsForName.unshift({
          type,
          specifiers: [
            pick(specifier, 'type', 'imported', 'importKind', 'local'),
          ],
          importKind,
          source,
        })
      }
    }
  }
  return result
})

module.exports = async function getSuggestedImports(file) {
  return await getSuggestedImportsForDir(path.dirname(file))
}
