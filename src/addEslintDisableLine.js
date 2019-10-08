const fs = require('fs-extra')
const { EOL } = require('os')

module.exports = function addEslintDisableLine({
  eslintJsonOutput,
  ruleIds,
  dryRun,
}) {
  if (typeof ruleIds === 'string') ruleIds = new Set([ruleIds])
  else if (Array.isArray(ruleIds)) ruleIds = new Set(ruleIds)
  for (let { filePath, messages } of eslintJsonOutput) {
    if (!messages || !messages.length) continue
    messages = messages.filter(
      ({ ruleId, severity }) => severity >= 2 && ruleIds.has(ruleId)
    )
    if (!messages.length) continue
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r\n?|\n/gm)
    let prevLine
    for (const { line, ruleId } of messages) {
      lines[line - 1] += `${
        line === prevLine ? ',' : ' // eslint-disable-line'
      } ${ruleId}`
      prevLine = line
    }
    console.error(filePath) // eslint-disable-line no-console
    if (!dryRun) fs.writeFileSync(filePath, lines.join(EOL), 'utf8')
  }
}

if (!module.parent) {
  module.exports({
    eslintJsonOutput: fs.readJsonSync(0, 'utf8'),
    ruleIds: process.argv.slice(2).filter(r => !/\^-/.test(r)),
    dryRun: process.argv.includes('--dry-run'),
  })
}
