function createSequelizeJoinModel({name, attributes, initAttributes, throughInitAttributes}) {
  return `// @flow
/* @flow-runtime enable */

import Sequelize, {Model} from 'sequelize'

export type ${name}InitAttributes = {
${initAttributes.replace(/^/gm, '  ')}
}

export type ${name}ThroughInitAttributes = {
${throughInitAttributes.replace(/^/gm, '  ')}
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
}
`
}

module.exports = createSequelizeJoinModel
