const j = require('jscodeshift').withParser('babylon')
const {statement} = j.template
const recast = require('recast')
const {lowerFirst} = require('lodash')
const addImports = require('./addImports')
const pathToMuiTheme = require('./pathToMuiTheme')

module.exports = function addStylesToComponent(root, file, filter = () => true) {
  const {createStyled} = addImports(root, statement`import createStyled from 'material-ui-render-props-styles'`, {commonjs: true})
  const {Classes} = addImports(root, statement`import type {Classes} from 'material-ui-render-props-styles'`)
  const {Theme} = addImports(root, statement([`import type {Theme} from '${pathToMuiTheme(file)}'`]))

  const element = root.find(j.JSXElement).filter(filter).at(0)
  const fsc = element.closest(j.ArrowFunctionExpression).at(0)
  let componentDeclarator = fsc.closest(j.VariableDeclarator)
  if (!componentDeclarator.size()) componentDeclarator = element.closest(j.ClassDeclaration)
  if (!componentDeclarator.size()) throw new Error("couldn't get a name for the component")

  const componentName = componentDeclarator.nodes()[0].id.name

  let declaration = componentDeclarator.nodes()[0].type === 'ClassDeclaration'
    ? componentDeclarator
    : componentDeclarator.closest(j.VariableDeclaration)

  declaration.insertBefore(
    `const ${lowerFirst(componentName)}Styles = (theme: ${Theme}) => ({
})`
  )
  declaration.insertBefore(
    `const ${componentName}Styles = ${createStyled}(${lowerFirst(componentName)}Styles, {name: '${componentName}'})`
  )

  const classesIdentifier = j.identifier('classes')
  const classesProperty = j.objectProperty(classesIdentifier, classesIdentifier)
  classesProperty.shorthand = true

  element.replaceWith(path => {
    return `(
  <${componentName}Styles>
    {({classes}: {classes: ${Classes}<typeof ${lowerFirst(componentName)}Styles>}) => (
${recast.print(path.node).toString().replace(/^/gm, '      ')}
    )}
  </${componentName}Styles>
)`
  })
}
