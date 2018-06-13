# @jedwards1211/codemods

[![Build Status](https://travis-ci.org/jcoreio/sequelize-codemods.svg?branch=master)](https://travis-ci.org/jcoreio/sequelize-codemods)
[![Coverage Status](https://codecov.io/gh/jcoreio/sequelize-codemods/branch/master/graph/badge.svg)](https://codecov.io/gh/jcoreio/sequelize-codemods)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

These are a bunch of codemods I've developed to speed of my dev process.  I'm
just stashing this on GitHub for myself and not making too much effort to offer
documentation.

Unless otherwise specified, the codemods are not structured to be passed to
`jscodeshift` as the `-t` argument -- rather, I am calling them from
[`atom-morpher`](https://github.com/suchipi/atom-morpher) scripts to transform
code in the editor.

## General

* `convertLambdaToReturn` - convert the expression body of arrow function(s)
  to block statement(s) with a return

## React

* `convertFSCToComponent` - convert function stateless component(s) to
  `React.Component` class(es)

## Sequelize

These transforms add the necessary imports, code and flow types for a new
association to module exporting a `Sequelize.Model`.  These transforms are
specific to how I structure my model folder and classes, and may or may not
fit your use case.

* `addBelongsToAssociation`
* `addHasOneAssociation`
* `addHasManyAssociation`
* `addBelongsToManyAssociation`
