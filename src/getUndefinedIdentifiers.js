const {spawn} = require('promisify-child-process')
const findRoot = require('find-root')

const unresolvedPattern = /Cannot resolve name `(\w+)`/i

module.exports = async function getUndefinedIdentifiers({file, text}) {
  const cwd = findRoot(file)
  const chunks = []
  const child = spawn('flow', [
    'check-contents',
    file,
    '--json',
    '--show-all-errors',
  ], {
    cwd,
    stdio: 'pipe',
  })
  child.stdout.on('data', chunk => chunks.push(chunk.toString('utf8')))
  child.stdin.end(text)
  await child
  const stdout = chunks.join('')

  const {errors} = JSON.parse(stdout)
  const result = new Set()
  errors.forEach(error => {
    for (let {descr} of error.message) {
      const match = unresolvedPattern.exec(descr)
      if (!match) continue
      result.add(match[1])
    }
  })
  return result
}
