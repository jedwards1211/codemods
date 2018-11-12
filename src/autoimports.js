const fs = require('fs-extra')
const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')
const getUndefinedIdentifiers = require('./getUndefinedIdentifiers')
const getSuggestedImports = require('./getSuggestedImports')
const addImports = require('./addImports')
const Client = require('dude-wheres-my-module/Client').default
const findRoot = require('find-root')
const PickImportList = require('./PickImportList')

const pickImportList = new PickImportList()

module.exports = async function autoimports({
  file,
  text,
  root,
}) {
  if (!text) text = await fs.readFile(file, 'utf8')

  const config = await getSuggestedImports(file)
  const undefinedIdentifiers = await getUndefinedIdentifiers({file, text})
  const client = new Client(findRoot(file))

  if (!root) root = j(text)
  for (let undefinedIdentifier of undefinedIdentifiers) {
    const {identifier} = undefinedIdentifier
    try {
      const suggested = (config.suggestedImports.get(identifier) || []).map(
        ast => ({ code: recast.print(ast), ast })
      )
      if (suggested.length !== 1) {
        suggested.push(...await client.getSuggestedImports({file, identifier}))
      }
      if (!suggested.length) {
        continue
      } else if (suggested.length === 1) {
        addImports(root, suggested[0].ast, {commonjs: true})
      } else {
        const selected = await new Promise((resolve, reject) => {
          try {
            pickImportList.setContext(undefinedIdentifier)
            pickImportList.setImports(suggested)
            pickImportList.setOnSelected(resolve)
            pickImportList.open()
          } catch (error) {
            reject(error)
          }
        })
        if (selected) {
          addImports(root, selected.ast, {commonjs: true})
        }
      }
    } catch (error) {
      console.error(error.stack) // eslint-disable-line no-console
    }
  }

  return root
}
