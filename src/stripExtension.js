// @flow

const path = require('path')

function stripExtension(file: string): string {
  const ext = path.extname(file)
  if (ext) return file.substring(0, file.length - ext.length)
  return file
}

module.exports = stripExtension
