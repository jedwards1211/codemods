const j = require('jscodeshift')
const recast = require('recast')
const {lowerFirst} = require('lodash')
const ensureImports = require('./ensureImports')
const ensureDefaultImport = require('./ensureDefaultImport')
const pathToMuiTheme = require('./pathToMuiTheme')

function addStylesToFSC(root, file, filter = () => true) {
  ensureDefaultImport(root, 'value', 'createStyled', 'material-ui-render-props-styles')
  ensureImports(root, 'type', ['Classes'], 'material-ui-render-props-styles')
  ensureImports(root, 'type', ['Theme'], pathToMuiTheme(file))

  let componentDeclarator

  const returnStatement = root.find(j.ReturnStatement, {
    argument: {type: 'JSXElement'}
  })

  if (returnStatement.length) {
    componentDeclarator = returnStatement.closest(j.VariableDeclarator)
  } else {
    componentDeclarator = root.find(j.VariableDeclarator, {
      init: {
        type: 'ArrowFunctionExpression',
        body: {
          type: 'JSXElement',
        }
      }
    })
  }
  const element = componentDeclarator.find(j.JSXElement).at(0)

  const componentName = componentDeclarator.nodes()[0].id.name

  const variableDeclaration = componentDeclarator.closest(j.VariableDeclaration)
  variableDeclaration.insertBefore(
    `const ${lowerFirst(componentName)}Styles = (theme: Theme) => ({
})`
  )
  variableDeclaration.insertBefore(
    `const ${componentName}Styles = createStyled(${lowerFirst(componentName)}Styles, {name: '${componentName}'})`
  )

  const classesIdentifier = j.identifier('classes')
  const classesProperty = j.objectProperty(classesIdentifier, classesIdentifier)
  classesProperty.shorthand = true

  element.replaceWith(path => {
    return `(
  <${componentName}Styles>
    {({classes}: {classes: Classes<typeof ${lowerFirst(componentName)}Styles>}) => (
${recast.print(path.node).toString().replace(/^/gm, '      ')}
    )}
  </${componentName}Styles>
)`
  })
}

module.exports = addStylesToFSC
