import * as graphql from 'graphql'
import path from 'path'
import fs from 'fs'

module.exports = graphql.buildSchema(
  fs.readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf8')
)
