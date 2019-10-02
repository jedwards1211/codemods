const j = require('jscodeshift').withParser('babylon')
const {statement} = j.template
const recast = require('recast')
const {lowerFirst} = require('lodash')
const addImports = require('./addImports')
const pathToMuiTheme = require('./pathToMuiTheme')
const closestProgramStatement = require('./closestProgramStatement')

module.exports = function addStylesToComponent(root, file, filter = () => true) {
  const {createStyled} = addImports(root, statement`import createStyled from 'material-ui-render-props-styles'`, {commonjs: true})
  const {Theme} = addImports(root, statement([`import type {Theme} from '${pathToMuiTheme(file)}'`]))

  const element = root.find(j.JSXElement).filter(filter).at(0)
  const fsc = element.closest(j.ArrowFunctionExpression).at(0)
  let componentDeclarator = fsc.closest(j.VariableDeclarator)
  if (!componentDeclarator.size()) componentDeclarator = element.closest(j.ClassDeclaration)
  if (!componentDeclarator.size()) throw new Error("couldn't get a name for the component")

  const componentName = componentDeclarator.nodes()[0].id.name

  const declaration = closestProgramStatement(componentDeclarator)

  if (!root.find(j.TypeAlias, {id: {name: 'Classes'}}).size()) {
    declaration.insertBefore(
      statement`type Classes<Styles> = $Call<<T>((any) => T) => { [$Keys<T>]: string }, Styles>`
    )
  }

  const styles = root.find(j.ExportDefaultDeclaration, {declaration: {name: componentName}}).size()
    ? 'styles'
    : `${lowerFirst(componentName)}Styles`
  const Styles = `${componentName}Styles`

  declaration.insertBefore(
    `const ${styles} = (theme: ${Theme}) => ({
})`
  )
  declaration.insertBefore(
    `const ${Styles} = ${createStyled}(${styles}, {name: '${componentName}'})`
  )

  const classesIdentifier = j.identifier('classes')
  const classesProperty = j.objectProperty(classesIdentifier, classesIdentifier)
  classesProperty.shorthand = true

  element.replaceWith(path => {
    return `(
  <${Styles}>
    {({classes}: {classes: Classes<typeof ${styles}>}) => (
${recast.print(path.node).toString().replace(/^/gm, '      ')}
    )}
  </${Styles}>
)`
  })
}
