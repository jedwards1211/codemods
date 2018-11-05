const getUndefinedIdentifiers = require('./getUndefinedIdentifiers')

const ids = getUndefinedIdentifiers({file: require.resolve("./undefTest")})
console.log(ids)
