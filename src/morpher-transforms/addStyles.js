const addStyles = require('../addStyles')

module.exports = ({pathInRange}) => ({
  description: 'wrap component with withStyles',
  transformAst: ({text, selection, root, file}) => {
    addStyles(root, pathInRange(text, selection), {file})
    return root
  }
})
