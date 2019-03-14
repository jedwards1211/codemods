const identifierFromFile = require('./identifierFromFile')

function createReactComponent(file) {
  const name = identifierFromFile(file)
  return `/**
 * @flow
 * @prettier
 */

import * as React from 'react'

export type Props = {
}

export default class ${name} extends React.Component<Props> {
  render(): React.Node {
  }
}
`
}

module.exports = createReactComponent
