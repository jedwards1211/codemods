const identifierFromFile = require('./identifierFromFile')

function createUntypedReactComponent(file) {
  const name = identifierFromFile(file)
  return `import * as React from 'react'

export default class ${name} extends React.Component {
  render() {
  }
}
`
}

module.exports = createUntypedReactComponent
