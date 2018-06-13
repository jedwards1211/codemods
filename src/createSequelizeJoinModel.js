// @flow

const identifierFromFile = require('./identifierFromFile')

function createSequelizeJoinModel(file: string): string {
  const name = identifierFromFile(file)
  return `// @flow
/* @flow-runtime enable */

import Sequelize, {Model} from 'sequelize'

export type ${name}InitAttributes = {
}

export type ${name}ThroughInitAttributes = {
}

export type ${name}Attributes = {
  createdAt: Date;
  updatedAt: Date;
}

export default class ${name} extends Model<${name}Attributes, ${name}InitAttributes> {
  createdAt: Date;
  updatedAt: Date;

  static initAttributes({sequelize}: {sequelize: Sequelize}) {
    super.init({
    }, {sequelize})
  }
}
`
}

module.exports = createSequelizeJoinModel
