const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')
const {statement} = j.template
const addImports = require('./addImports')
const pathInProject = require('./pathInProject')

module.exports = function fixApolloUpdateFn({root, file, filter}) {
  const {normalizeData} = addImports(root, statement([`import normalizeData from '${pathInProject(file, 'src/universal/apollo/normalizeData')}'`]))
  const {DataProxy, FetchResult} = addImports(root, statement`import type {DataProxy, FetchResult} from 'react-apollo'`)
  const fn = root.find(j.ArrowFunctionExpression).filter(filter)
  fn.replaceWith(path => {
    const dataSelection = j(path).find(j.ObjectProperty, {key: {name: 'data'}}).at(0)
    return statement([`(cache: ${DataProxy}, {data: rawData}: ${FetchResult}<any>) => {
  const data = ${normalizeData}(rawData)
  if (!data) return
  ${dataSelection.size() ? `const ${recast.print(dataSelection.nodes()[0].value)} = data` : ''}
${recast.print(path.node.body).toString().replace(/^/gm, '  ')}
}`])
  })
}
