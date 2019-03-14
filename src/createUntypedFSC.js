const identifierFromFile = require('./identifierFromFile')

function createUntypedFSC(file) {
  const name = identifierFromFile(file)
  return `import * as React from 'react'

const ${name} = () => (
  <div />
)

export default ${name}
`
}

module.exports = createUntypedFSC
