const subpkgRx = /^lodash\.(.+)$/
const path = require('path')
const { readdirSync } = require('fs')
const esModules = readdirSync(
  path.dirname(require.resolve('lodash-es/package.json'))
)

const esModulesMap = new Map(
  esModules
    .map(file => {
      const match = /^(.*)\.js$/.exec(file)
      if (match) return [match[1].toLowerCase(), match[1]]
    })
    .filter(pair => pair)
)

module.exports = function switchToLodashES(fileInfo, api) {
  const j = api.jscodeshift
  const { statement } = j.template
  const root = api.jscodeshift(fileInfo.source)
  if (
    root
      .find(j.ImportDeclaration, { source: { value: 'lodash' } })
      .find(j.ImportDefaultSpecifier)
      .size()
  ) {
    throw new Error('WARNING: default imports not supported')
  }
  root
    .find(j.ImportDeclaration, {
      source: { value: value => subpkgRx.test(value) },
    })
    .forEach(path => {
      const match = subpkgRx.exec(path.value.source.value)
      const esModule = esModulesMap.get(match[1])
      if (esModule) path.value.source.value = `lodash-es/${esModule}`
    })
  root
    .find(j.ImportDeclaration, { source: { value: 'lodash' } })
    .replaceWith(path =>
      path.value.specifiers.map(specifier =>
        statement([
          `import ${specifier.local.name} from 'lodash-es/${
            specifier.imported.name
          }'\n`,
        ])
      )
    )
  return root.toSource()
}
