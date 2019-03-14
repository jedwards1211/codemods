const identifierFromFile = require('./identifierFromFile')

function createUntypedFSCWithStyles(file) {
  const name = identifierFromFile(file)
  return `import * as React from 'react'
import withStyles from '@material-ui/core/styles/withStyles'

const styles = theme => ({
  root: {
  }
})

const ${name} = ({classes}) => (
  <div className={classes.root} />
)

export default withStyles(styles)(${name})
`
}

module.exports = createUntypedFSCWithStyles
