// @flow

const pathToMuiTheme = require('./pathToMuiTheme')
const identifierFromFile = require('./identifierFromFile')

function createMaterialUIComponent(file: string): string {
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

export default class ${name} extends React.Component<Props> {
  render(): React.Node {
    return (
      <${name}Styles classes={classes}>
        {({classes}: {classes: Classes<typeof styles>}) => (
          <div className={classes.root} {...props}>

          </div>
        )}
      </${name}Styles>
    )
  }
}
`
}

module.exports = createMaterialUIComponent
