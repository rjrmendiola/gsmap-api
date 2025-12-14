'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SoilMoisture extends Model {
    static associate(models) {
      // each soil moisture record belongs to a barangay
      SoilMoisture.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay'
      });
    }
  }
  SoilMoisture.init({
    barangay_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    alt_name: DataTypes.STRING,
    short_name: DataTypes.STRING,
    admin_leve: DataTypes.STRING,
    boundary: DataTypes.STRING,
    mean: DataTypes.FLOAT,
    mean_norm: DataTypes.FLOAT,
    population: DataTypes.INTEGER,
    population_source: DataTypes.STRING,
    type: DataTypes.STRING,
    wikidata: DataTypes.STRING,
    ref: DataTypes.INTEGER,
    old_ref: DataTypes.STRING,
    geojson: DataTypes.JSON,
  }, {
    sequelize,
    modelName: 'SoilMoisture',
    tableName: 'soil_moistures',
    underscored: true,
  });

  return SoilMoisture;
};