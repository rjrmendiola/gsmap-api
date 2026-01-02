'use strict';
const {  Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Province extends Model {
    static associate(models) {
      // a province has many municipalities
      Province.hasMany(models.Municipality, {
        foreignKey: 'province_id',
        as: 'municipalities'
      });
    }
  }
  Province.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Province',
    tableName: 'provinces',
    underscored: true,
  });
  return Province;
};