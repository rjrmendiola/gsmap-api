'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WeatherSnapshot extends Model {
    static associate(models) {
      // a weather snapshot belongs to a barangay
      WeatherSnapshot.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay'
      });
    }
  }
  WeatherSnapshot.init({
    barangay_id: DataTypes.INTEGER,
    payload: DataTypes.JSON,
    fetched_at: DataTypes.DATE,
    source: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'WeatherSnapshot',
    tableName: 'weather_snapshots',
    underscored: true,
  });
  return WeatherSnapshot;
};