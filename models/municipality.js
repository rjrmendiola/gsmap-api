'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Municipality extends Model {
    static associate(models) {
      // a municipality belongs to a province
      Municipality.belongsTo(models.Province, {
        foreignKey: 'province_id',
        as: 'province'
      });
    }
  }
  Municipality.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    province_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Municipality',
    tableName: 'municipalities',
    underscored: true,
  });
  return Municipality;
};