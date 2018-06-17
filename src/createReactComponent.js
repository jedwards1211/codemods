// @flow

const identifierFromFile = require('./identifierFromFile')

function createReactComponent(file: string): string {
  const name = identifierFromFile(file)
  return `// @flow

import * as React from 'react'

export type Props = {
}

export default class ${name} extends React.Component<Props> {
  render(): ?React.Node {
  }
}
`
}

module.exports = createReactComponent