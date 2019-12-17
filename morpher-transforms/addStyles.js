"use strict";

var addStyles = require('../addStyles');

module.exports = function (_ref) {
  var pathInRange = _ref.pathInRange;
  return {
    description: 'wrap component with withStyles',
    transformAst: function transformAst(_ref2) {
      var text = _ref2.text,
          selection = _ref2.selection,
          root = _ref2.root,
          file = _ref2.file;
      addStyles(root, pathInRange(text, selection), {
        file: file
      });
      return root;
    }
  };
};