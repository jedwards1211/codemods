/* global atom */

const j = require('jscodeshift').withParser('babylon')
const identifierFromFile = require('./identifierFromFile')
exports.identifierFromFile = identifierFromFile
const pathsToTransformFilter = require('./pathsToTransformFilter')
exports.pathsToTransformFilter = pathsToTransformFilter

function getCharacterIndexRange(text, selection) {
  const newline = /\r\n?|\n/mg
  let match
  for (let i = 0; i < selection.start.row; i++) {
    match = newline.exec(text)
  }
  if (!match) throw new Error('failed to get range')
  const start = match.index + match[0].length + selection.start.column

  for (let i = selection.start.row; i < selection.end.row; i++) {
    match = newline.exec(text)
  }
  const end = match.index + match[0].length + selection.end.column
  return {start, end}
}
exports.getCharacterIndexRange = getCharacterIndexRange

function pathInRange(text, selection) {
  const {start, end} = getCharacterIndexRange(text, selection)
  return pathsToTransformFilter(start, end)
}
exports.pathInRange = pathInRange

function activeBuffer() {
  const activeEditor = atom.workspace.getActiveTextEditor()
  if (!activeEditor) throw new Error("There's no active editor to perform a transform on")
  return activeEditor.getBuffer()
}
exports.activeBuffer = activeBuffer

function activeFile() {
  return activeBuffer().file.path
}
exports.activeFile = activeFile

const jscodeshiftTransform = transform => ({text, ...props}) => {
  const root = j(text)
  transform({text, ...props, root, file: activeFile()})
  return {text: root.toSource()}
}
exports.jscodeshiftTransform = jscodeshiftTransform
