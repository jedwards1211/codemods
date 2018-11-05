const without = require('lodash/omit')

const input = [1, 2, 3, foo]
const output = without(map(input, t => String(t)), 2)
