module.exports = function groupByParent(collection) {
  const groups = new Map()
  collection.forEach(path => {
    let group = groups.get(path.parent)
    if (!group) {
      group = []
      groups.set(path.parent, group)
    }
    group.push(path)
  })
  return [...groups.values()]
}
