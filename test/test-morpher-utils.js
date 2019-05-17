const j = require("jscodeshift").withParser("babylon")
const identifierFromFile = require("../src/identifierFromFile")
const pathsToTransformFilter = require("../src/pathsToTransformFilter")

export default function morpherUtils(options) {
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

  function pathInRange(text, selection) {
    const { start, end } = getCharacterIndexRange(text, selection)
    return pathsToTransformFilter(start, end)
  }

  function activeBuffer() {
    throw new Error("not supported in test mode")
  }

  function activeFile() {
    if (!options.activeFile) throw new Error("no test activeFile given")
    return options.activeFile
  }

  const jscodeshiftTransform = transform => ({ text, ...props }) => {
    const root = j(text)
    transform({ text, ...props, root })
    return { text: root.toSource() }
  }

  function apply(transform, props) {
    if (transform instanceof Function) transform = transform(utils)
    const onSelected = transform.transformAst
      ? jscodeshiftTransform(transform.transformAst)
      : transform.onSelected
    return onSelected(props)
  }

  const utils = {
    identifierFromFile,
    pathsToTransformFilter,
    getCharacterIndexRange,
    pathInRange,
    activeBuffer,
    activeFile,
    jscodeshiftTransform,
    apply,
  }
  return utils
}
