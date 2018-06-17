const pathToMuiTheme = require('./pathToMuiTheme')
const identifierFromFile = require('./identifierFromFile')

function createMaterialUIFSC(file) {
  const name = identifierFromFile(file)
  return `// @flow

import * as React from 'react'
import createStyled from 'material-ui-render-props-styles'
import type {Classes} from 'material-ui-render-props-styles'
import type {Theme} from '${pathToMuiTheme(file)}'

const styles = (theme: Theme) => ({
  root: {
  },
})

export type Props = {
  +classes?: $Shape<Classes<typeof styles>>,
}

const ${name}Styles = createStyled(styles, {name: '${name}'})

const ${name} = ({classes, ...props}: Props): React.Node => (
  <${name}Styles classes={classes}>
    {({classes}: {classes: Classes<typeof styles>}) => (
      <div className={classes.root} {...props}>

      </div>
    )}
  </${name}Styles>
)

export default ${name}
`
}

module.exports = createMaterialUIFSC
