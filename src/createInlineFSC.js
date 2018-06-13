// @flow

const identifierFromFile = require('./identifierFromFile')

function createInlineFSC(name: ?string, file: string): string {
  if (!name) name = identifierFromFile(file)
  return `export type ${name}Props = {
}

const ${name} = (props: ${name}Props): React.Node => (
  <div />
)
`
}

module.exports = createInlineFSC
