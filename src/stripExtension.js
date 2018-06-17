const path = require('path')

function stripExtension(file) {
  const ext = path.extname(file)
  if (ext) return file.substring(0, file.length - ext.length)
  return file
}

module.exports = stripExtension
