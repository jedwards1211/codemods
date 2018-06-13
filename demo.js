const j = require('jscodeshift').withParser('babylon')

if (!module.parent) {
  const code = `
// @flow
/* @flow-runtime enable */

import Sequelize, {Model} from 'sequelize'
import type {BelongsToGetOne} from 'sequelize'

export default class User extends Model {
  static initAssociations() {

  }
}
`
  const root = j(code)

  const addBelongsToManyAssociation = require('./addBelongsToManyAssociation')

  addBelongsToManyAssociation({
    root,
    position: code.indexOf('static'),
    target: 'DeviceGroup',
    through: 'UsersDeviceGroupsJoin',
    options: {
      foreignKey: 'deviceGroupId',
      otherKey: 'userId',
    }
  })

  addBelongsToManyAssociation({
    root,
    position: root.toSource().indexOf('static initAssociations'),
    target: 'Device',
    through: 'UsersDevicesJoin',
    options: {
      foreignKey: 'deviceId',
      otherKey: 'userId',
    }
  })


  console.log(root.toSource())
}
