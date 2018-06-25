const {createSelector} = require('reselect')
function * ancestorsOfPath(path) {
  let {parentPath} = path
  while (parentPath != null) {
    yield parentPath
    parentPath = parentPath.parentPath
  }
}

module.exports = function pathsToTransformFilter(start, end = start) {
  const selectPathSet = createSelector(
    paths => paths,
    paths => {
      // if any nodes are wholly contained in the range, use those
      // (but not nodes nested inside of them)
      const allFullyContained = paths.filter(path =>
        path.value.start >= start && path.value.end <= end
      )
      if (allFullyContained.length) {
        const allFullyContainedSet = new Set(allFullyContained)
        return new Set(allFullyContained.filter(path => {
          for (let ancestor of ancestorsOfPath(path)) {
            if (allFullyContainedSet.has(ancestor)) return false
          }
          return true
        }))
      }

      // return the bottommost node that fully contains the range
      const allFullContainers = paths.filter(path =>
        path.value.start <= start && path.value.end >= end
      )
      const fullContainersSet = new Set(allFullContainers)
      allFullContainers.forEach(path => {
        for (let ancestor of ancestorsOfPath(path)) {
          fullContainersSet.delete(ancestor)
        }
      })
      return fullContainersSet
    }
  )

  return (path, index, paths) => selectPathSet(paths).has(path)
}
