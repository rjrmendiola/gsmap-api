'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WeatherSnapshot extends Model {
    static associate(models) {
      WeatherSnapshot.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay'
      });
    }
  }
  WeatherSnapshot.init({
    barangay_id: DataTypes.INTEGER,
    weather_json: DataTypes.JSON,
    fetched_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'WeatherSnapshot',
    tableName: 'weather_snapshots',
    underscored: true,
  });
  return WeatherSnapshot;
};