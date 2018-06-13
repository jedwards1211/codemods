// @flow

const identifierFromFile = require('./identifierFromFile')

function createFSC(file: string): string {
  const name = identifierFromFile(file)
  return `// @flow

import * as React from 'react'

export type Props = {
}

const ${name} = (props: Props): React.Node => (
  <div />
)

export default ${name}
`
}

module.exports = createFSC
