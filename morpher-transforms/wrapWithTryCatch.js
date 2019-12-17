"use strict";

var j = require('jscodeshift').withParser('babylon');

var groupByParent = require('../groupByParent');

var recast = require('recast');

module.exports = function (_ref) {
  var pathInRange = _ref.pathInRange;
  return {
    description: 'wrap selected statements with try/catch block',
    transformAst: function transformAst(_ref2) {
      var text = _ref2.text,
          selection = _ref2.selection,
          root = _ref2.root;
      var statements = root.find(j.Statement).filter(pathInRange(text, selection));
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = groupByParent(statements)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var group = _step.value;
          j(group[0]).replaceWith("try {\n".concat(group.map(function (path) {
            return recast.print(path).code;
          }).join('\n').replace(/^/gm, '  '), "\n} catch (error) {\n}"));

          for (var i = 1, end = group.length; i < end; i++) {
            j(group[i]).remove();
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return root;
    }
  };
};