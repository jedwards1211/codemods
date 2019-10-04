const { flow } = require('lodash/fp')

const pipeline = (input, ...args) => flow(...args)(input)
module.exports = pipeline
