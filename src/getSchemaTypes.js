const gql = require('graphql-tag')
const graphql = require('graphql')
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
        kind
        name
        enumValues {
          name
        }
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
        inputFields {
          name
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
    convertedArgs[arg.name] = Object.assign({}, arg, {
      type: convertRawType(arg),
    })
  }
  return convertedArgs
}

function convertRawField({ name, args, type }) {
  return { name, type: convertRawType(type), args: convertRawArgs(args) }
}

function convertRawFields(fields) {
  const convertedFields = {}
  for (let field of fields) {
    convertedFields[field.name] = convertRawField(field)
  }
  return convertedFields
}

function convertRawInputField({ name, type }) {
  return { name, type: convertRawType(type) }
}

function convertRawInputFields(fields) {
  const convertedFields = {}
  for (let field of fields) {
    convertedFields[field.name] = convertRawInputField(field)
  }
  return convertedFields
}

function convertRawType({
  name,
  kind,
  ofType,
  fields,
  inputFields,
  enumValues,
}) {
  return {
    name,
    kind,
    ofType: ofType ? convertRawType(ofType) : null,
    fields: fields ? convertRawFields(fields) : null,
    inputFields: inputFields ? convertRawInputFields(inputFields) : null,
    enumValues,
  }
}

function linkTypes(rawTypes) {
  const types = {}

  for (let rawType of rawTypes) {
    const { name } = rawType
    if (name) {
      types[name] = convertRawType(rawType)
    }
  }
  function resolveType(type, parent) {
    const { name, ofType } = type
    if (name && types[name]) type = types[name]
    if (ofType) type.ofType = resolveType(ofType, parent)
    if (parent) {
      let { parents } = type
      if (!parents) type.parents = parents = []
      parents.push(parent)
    }
    return type
  }
  for (let name in types) {
    const type = types[name]
    const { fields, inputFields } = type
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
    if (inputFields) {
      for (let name in inputFields) {
        const field = inputFields[name]
        field.type = resolveType(field.type, field)
        field.parent = type
      }
    }
  }
  return types
}

module.exports = async function getSchemaTypes({ schema, server }) {
  let result
  if (schema) result = await graphql.execute(schema, typesQuery)
  else if (server)
    result = (await superagent
      .post(server)
      .type('json')
      .accept('json')
      .send({
        query: typesQuery,
      })).body
  const {
    data: {
      __schema: { types },
    },
  } = result
  return linkTypes(types)
}
