module.exports = function isChildJSXElement(path) {
  return path.parent && path.parent.node.type === 'JSXElement' &&
    path.parent.node.children.indexOf(path.node) >= 0
}
