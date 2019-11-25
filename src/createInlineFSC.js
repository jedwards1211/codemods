const identifierFromFile = require('./identifierFromFile')

function createInlineFSC(name, file) {
  if (!name) name = identifierFromFile(file)
  const isTypeScript = /\.tsx?$/.test(file)
  return `export type ${name}Props = {
}

const ${name} = (props: ${name}Props): React.${
    isTypeScript ? 'ReactNode' : 'Node'
  } => (
  <div />
)
`
}

module.exports = createInlineFSC
