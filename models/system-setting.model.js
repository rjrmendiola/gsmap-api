'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemSetting extends Model {
    static associate(models) {
    }
  }
  SystemSetting.init({
    name: DataTypes.STRING,
    value: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    underscored: true,
  });
  return SystemSetting;
};