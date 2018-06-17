const identifierFromFile = require('./identifierFromFile')

function createSequelizeModel(file) {
  const name = identifierFromFile(file)
  return `// @flow
/* @flow-runtime enable */

import Sequelize, {Model} from 'sequelize'

export type ${name}InitAttributes = {
}

export type ${name}Attributes = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export default class ${name} extends Model<${name}Attributes, ${name}InitAttributes> {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  static initAttributes({sequelize}: {sequelize: Sequelize}) {
    super.init({
    }, {sequelize})
  }

  static initAssociations() {
  }
}
`
}

module.exports = createSequelizeModel
