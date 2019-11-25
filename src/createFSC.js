const identifierFromFile = require('./identifierFromFile')

function createFSC(file) {
  const name = identifierFromFile(file)
  const isTypeScript = /\.tsx?$/.test(file)
  return `/**${isTypeScript ? '' : '\n * @flow'}
 * @prettier
 */

import * as React from 'react'

export type Props = {
}

const ${name} = (props: Props): React.${
    isTypeScript ? 'ReactNode' : 'Node'
  } => (
  <div />
)

export default ${name}
`
}

module.exports = createFSC
