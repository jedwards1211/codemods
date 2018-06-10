const getNearestPath = require('./getNearestPath')

module.exports = function insertNodes(arrayPath, position, ...nodes) {
  const nearest = getNearestPath(arrayPath, position)
  if (nearest) {
    if (position <= nearest.node.start) {
      nodes.forEach(node => nearest.insertBefore(node))
    } else {
      for (let i = nodes.length - 1; i >= 0; i--) nearest.insertAfter(nodes[i])
    }
  } else {
    arrayPath.value.push(...nodes)
  }
}
