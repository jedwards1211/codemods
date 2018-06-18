module.exports = function * ancestorsOfPath(path) {
  let {parent} = path
  while (parent != null) {
    yield parent
    parent = parent.parent
  }
}
