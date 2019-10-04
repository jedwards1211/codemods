/* global atom */

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

const jscodeshiftBasedTransform = transform => ({text, ...props}) => {
  const root = require('jscodeshift').withParser('babylon')(text)
  transform({text, ...props, root, file: activeFile()})
  return {text: root.toSource()}
}
exports.jscodeshiftBasedTransform = jscodeshiftBasedTransform

const jscodeshiftTransform = transform => ({text, selection, ...options}) => {
  let jscodeshift = require('jscodeshift')
  if (transform.parser) jscodeshift = jscodeshift.withParser(transform.parser)

  const fileInfo = {
    path: activeFile(),
    source: text,
  }
  const api = {
    jscodeshift,
    stats: value => {},
    report: process.stdout.write.bind(process.stdout),
  }
  options.selection = getCharacterIndexRange(text, selection)

  const result = transform(fileInfo, api, options)
  if (typeof result === 'string' && result !== text) return {text: result}
  return {text}
}
exports.jscodeshiftTransform = jscodeshiftTransform
