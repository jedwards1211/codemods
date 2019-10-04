const system = require('@material-ui/system')

for (const key in system) {
  const value = system[key]
  if (value && Array.isArray(value.filterProps)) {
    value.filterProps.forEach(prop => {
      if (!exports[prop] || system[exports[prop]].filterProps.length < value.filterProps.length) {
        exports[prop] = key
      }
    })
  }
}
