module.exports = function reformat(literals) {
  literals.forEach(({ node }) => {
    delete node.start
    delete node.end
    delete node.location
  })
  return literals
}
