const gql = require('graphql-tag')
const superagent = require('superagent')

const typesQuery = gql`
fragment typeInfo on __Type {
  name
  kind
  ofType {
    name
    kind
    ofType {
      name
      kind
      ofType {
        name
      }
    }
  }
}
query getTypes {
  __schema {
    types {
      name
      fields {
        name
        args {
          name
          type {
            ...typeInfo
          }
        }
        type {
          ...typeInfo
        }
      }
    }
  }
}
`

function convertRawArgs(args) {
  const convertedArgs = {}
  for (let arg of args) {
    convertedArgs[arg.name] = Object.assign({}, arg, {type: convertRawType(arg)})
  }
  return convertedArgs
}

function convertRawField({name, args, type}) {
  return {name, type: convertRawType(type), args: convertRawArgs(args)}
}

function convertRawFields(fields) {
  const convertedFields = {}
  for (let field of fields) {
    convertedFields[field.name] = convertRawField(field)
  }
  return convertedFields
}

function convertRawType({name, kind, ofType, fields}) {
  return {
    name,
    kind,
    ofType: ofType ? convertRawType(ofType) : null,
    fields: fields ? convertRawFields(fields) : null,
  }
}

function linkTypes(rawTypes) {
  const types = {}

  for (let rawType of rawTypes) {
    const {name} = rawType
    if (name) {
      types[name] = convertRawType(rawType)
    }
  }
  function resolveType(type, parent) {
    const {name, ofType} = type
    if (name && types[name]) type = types[name]
    if (ofType) type.ofType = resolveType(ofType, parent)
    if (parent) {
      let {parents} = type
      if (!parents) type.parents = parents = []
      parents.push(parent)
    }
    return type
  }
  for (let name in types) {
    const type = types[name]
    const {fields} = type
    if (fields) {
      for (let name in fields) {
        const field = fields[name]
        field.type = resolveType(field.type, field)
        for (let name in field.args) {
          const arg = field.args[name]
          arg.type = resolveType(arg.type)
        }
        field.parent = type
      }
    }
  }
  return types
}

module.exports = async function getSchemaTypes(server) {
  const {body: {data: {__schema: {types}}}} = await superagent.post(server)
    .type('json').accept('json').send({
      query: typesQuery,
    })
  return linkTypes(types)
}
