const addImports = require('jscodeshift-add-imports')
const pipeline = require('./pipeline')
const systemImports = require('./materialUISystemImports')
const {uniq, map, compact} = require('lodash/fp')

function setupMaterialUISystem({source}, {jscodeshift: j}) {
  const root = j(source)
  const {statement} = j.template

  const boxAttributes = root.find(j.JSXOpeningElement, {
    name: {
      name: 'Box',
    }
  }).find(j.JSXAttribute).nodes().map(node => node.name.name)

  const neededImports = pipeline(
    boxAttributes,
    map(attr => systemImports[attr]),
    compact,
    uniq
  )
  const {styled} = addImports(root, statement`import { styled } from '@material-ui/styles'`)
  const imports = [...Object.values(addImports(
    root,
    statement([`import { ${neededImports.join(', ')} } from '@material-ui/system'`])))
  ].sort()
  let compose
  if (neededImports.length > 1) {
    ({compose} = addImports(root, statement`import { compose } from '@material-ui/system'`))
  }

  const boxStatement = statement([`const Box = ${styled}('div')(
  ${compose
    ? `${compose}(${imports.join(', ')})`
    : imports[0]
  }
)`])

  const existingBox = root.find(j.VariableDeclarator, {
    id: {name: 'Box'},
  })

  if (existingBox.size()) {
    existingBox.replaceWith(boxStatement.declarations[0])
  } else {
    const importDecls = root.find(j.ImportDeclaration)
    const lastImportDecl = importDecls.at(importDecls.size() - 1)
    lastImportDecl.insertAfter(boxStatement)
  }

  const importsToKeep = new Set(neededImports)
  if (compose) importsToKeep.add('compose')

  root.find(j.ImportDeclaration, {source: {value: '@material-ui/system'}}).forEach(
    ({node}) => node.specifiers = node.specifiers.filter(specifier => importsToKeep.has(specifier.imported.name))
  )

  return root.toSource()
}
setupMaterialUISystem.parser = 'babylon'

module.exports = setupMaterialUISystem
