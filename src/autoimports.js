const fs = require('fs-extra')
const j = require('jscodeshift').withParser('babylon')
const {statement} = j.template
const getUndefinedIdentifiers = require('./getUndefinedIdentifiers')
const getSuggestedImports = require('./getSuggestedImports')
const addImports = require('./addImports')
const findRoot = require('find-root')
const path = require('path')
const glob = require('es6-promisify')(require('glob'))

module.exports = async function autoimports({
  file,
  text,
  root,
}) {
  const cwd = findRoot(file)
  if (!text) text = await fs.readFile(file, 'utf8')

  const config = await getSuggestedImports(file)
  const identifiers = await getUndefinedIdentifiers({file, text})

  if (!root) root = j(text)

  for (let identifier of identifiers) {
    const suggested = config.suggestedImports.get(identifier)
    if (Array.isArray(suggested)) {
      addImports(root, suggested[0], {commonjs: true})
    } else {
      const modules = (await glob(`**/${identifier}.js`, {
        cwd,
        ignore: ['node_modules/**', 'flow-typed/**', ...config.ignore || []],
      })).map(module => {
        const result = path.relative(path.dirname(file), path.resolve(cwd, module)).replace(/\.js$/, '')
        return result[0] === '.' ? result : `./${result}`
      }).sort((a, b) => b.length - a.length)

      if (modules.length) {
        const [module] = modules
        addImports(root, statement([`import ${path.basename(module)} from '${module}'`]))
      }
    }
  }

  return root
}
