const fs = require('fs-extra')
const j = require('jscodeshift').withParser('babylon')
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

  const client = new Client(findRoot(file))
  client.on('progress', ({completed, total}) => pickImportList.setProgress({
    completed,
    total,
  }))
  pickImportList.open()

  let first = true
  if (!root) root = j(text)
  const suggestions = await client.getSuggestedImports({code: text, file})
  for (let key in suggestions) {
    const {identifier, start, context, suggested} = suggestions[key]
    try {
      if (!suggested.length) {
        continue
      } else if (suggested.length === 1) {
        addImports(root, suggested[0].ast, {commonjs: true})
      } else {
        const selected = await new Promise((resolve, reject) => {
          try {
            pickImportList.setContext({identifier, line: start.line, context})
            pickImportList.setImports(suggested)
            pickImportList.setOnSelected(resolve)
            if (!first) pickImportList.open()
          } catch (error) {
            reject(error)
          }
        })
        if (selected) {
          addImports(root, selected.ast)
        }
      }
    } catch (error) {
      console.error(error.stack) // eslint-disable-line no-console
    }
    first = false
  }

  return root
}
