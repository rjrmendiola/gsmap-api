'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WeatherSetting extends Model {
    static associate(models) {
    }
  }
  WeatherSetting.init({
    refresh_interval_minutes: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'WeatherSetting',
    tableName: 'WeatherSettings',
    underscored: true,
  });
  return WeatherSetting;
};