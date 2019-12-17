"use strict";

var j = require('jscodeshift').withParser('babylon');

var _require = require('../morpher-utils'),
    jscodeshiftTransform = _require.jscodeshiftTransform;

exports.description = 'converts Name/Value pairs in CF template environment variables to objects';
exports.onSelected = jscodeshiftTransform(function (_ref) {
  var root = _ref.root;
  root.find(j.ObjectProperty, {
    key: {
      type: 'Identifier',
      name: 'Environment'
    },
    value: {
      type: 'ArrayExpression'
    }
  }).replaceWith(function (path) {
    var elements = path.node.value.elements;
    return j.objectProperty(j.identifier('Environment'), j.callExpression(j.identifier('cfEnvironment'), [j.objectExpression(elements.map(function (e) {
      if (e.type !== 'ObjectExpression') return null;
      var nameProp = e.properties.find(function (p) {
        return p.key.name === 'Name';
      });
      var valueProp = e.properties.find(function (p) {
        return p.key.name === 'Value';
      });
      if (!nameProp || !valueProp) return null;
      return j.objectProperty(j.identifier(nameProp.value.value), valueProp.value);
    }))]));
  });
});