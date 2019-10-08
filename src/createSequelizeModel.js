function createSequelizeModel({ name, attributes, initAttributes }) {
  return `/**
 * @flow
 * @prettier
 */
/* @flow-runtime enable */

import Sequelize, {Model} from 'sequelize'

export type ${name}InitAttributes = {
${initAttributes.replace(/^/gm, '  ')}
}

export type ${name}Attributes = {
${attributes.replace(/^/gm, '  ')}
}

export default class ${name} extends Model<${name}Attributes, ${name}InitAttributes> {
${attributes.replace(/^/gm, '  ')}

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
