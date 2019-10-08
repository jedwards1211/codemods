const subpkgRx = /^lodash\.(.+)$/
const path = require('path')
const { readdirSync } = require('fs')
const modules = readdirSync(
  path.dirname(require.resolve('lodash/package.json'))
)

const modulesMap = new Map(
  modules
    .map(file => {
      const match = /^(.*)\.js$/.exec(file)
      if (match) return [match[1].toLowerCase(), match[1]]
    })
    .filter(pair => pair)
)

module.exports = function swichToMonolithicLodash(fileInfo, api) {
  const j = api.jscodeshift
  const root = api.jscodeshift(fileInfo.source)
  const lodashImports = root.find(j.ImportDeclaration, {
    specifiers: [{ type: 'ImportDefaultSpecifier' }],
    source: { value: value => subpkgRx.test(value) },
  })
  const specifiers = []
  lodashImports.forEach(path => {
    const match = subpkgRx.exec(path.value.source.value)
    specifiers.push(
      j.importSpecifier(
        j.identifier(modulesMap.get(match[1])),
        j.identifier(path.value.specifiers[0].local.name)
      )
    )
  })
  if (specifiers.length) {
    lodashImports
      .at(0)
      .replaceWith(j.importDeclaration(specifiers, j.literal('lodash')))
    for (let i = 1; i < lodashImports.size(); i++) {
      lodashImports.at(i).remove()
    }
  }
  return root.toSource()
}
