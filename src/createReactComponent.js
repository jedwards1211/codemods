const identifierFromFile = require('./identifierFromFile')

function createReactComponent(file) {
  const name = identifierFromFile(file)
  const isTypeScript = /\.tsx?$/.test(file)
  return `/**${isTypeScript ? '' : ' * @flow'}
 * @flow
 * @prettier
 */

import * as React from 'react'

export type Props = {
}

export default class ${name} extends React.Component<Props> {
  render(): React.${isTypeScript ? 'ReactNode' : 'Node'} {
  }
}
`
}

module.exports = createReactComponent
