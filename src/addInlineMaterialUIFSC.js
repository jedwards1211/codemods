const {upperFirst, lowerFirst} = require("lodash")
const pathToMuiTheme = require('./pathToMuiTheme')
const jscodeshift = require('jscodeshift').withParser('babylon')
const ensureDefaultImport = require('./ensureDefaultImport')
const ensureImports = require('./ensureImports')

function addInlineMaterialUIFSC({file, code, name, position}) {
  name = upperFirst(name)
  const styles = `${lowerFirst(name)}Styles`
  code = `${code.substring(0, position)}const ${styles} = (theme: Theme) => ({
  root: {
  },
})

type ${name}Props = {
  +classes?: $Shape<typeof ${styles}>,
}

const ${name}Styles = createStyled(${styles}, {name: '${name}'})

const ${name} = ({classes}: ${name}Props): React.Node => (
  <${name}Styles classes={classes}>
    {({classes}) => (
      <div className={classes.root} />
    )}
  </${name}Styles>
)
${code.substring(position)}`

  const root = jscodeshift(code)

  ensureDefaultImport(root, 'value', 'createStyled', 'material-ui-render-props-styles')
  ensureImports(root, 'type', ['Classes'], 'material-ui-render-props-styles')
  ensureImports(root, 'type', ['Theme'], pathToMuiTheme(file))

  return root.toSource()
}

module.exports = addInlineMaterialUIFSC
