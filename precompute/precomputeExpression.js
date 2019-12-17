"use strict";

var resolveIdentifier = require('./resolveIdentifier');

var FAIL = require('./FAIL');

function precomputeExpression(path) {
  if (path === FAIL || !path.node || !path.node.type) {
    return FAIL;
  }

  switch (path.node.type) {
    case 'NullLiteral':
      return null;

    case 'Literal':
    case 'NumericLiteral':
    case 'StringLiteral':
      return path.node.value;

    case 'TemplateLiteral':
      return precomputeTemplateLiteral(path);

    case 'Identifier':
      return precomputeExpression(resolveIdentifier(path));
  }

  return FAIL;
}

module.exports = precomputeExpression;

function precomputeTemplateLiteral(path) {
  var quasis = path.node.quasis;
  if (quasis.length === 1) return quasis[0].value.cooked;
  var parts = [];
  var i = 0;

  while (i < quasis.length - 1) {
    parts.push(quasis[i].value.cooked);
    var expr = precomputeExpression(path.get('expressions', i));
    if (expr === FAIL) return FAIL;
    parts.push(expr);
    i++;
  }

  parts.push(quasis[i].value.cooked);
  return parts.join('');
}