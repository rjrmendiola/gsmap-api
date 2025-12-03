'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Slope extends Model {
    static associate(models) {
      Slope.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay'
      });
    }
  }
  Slope.init({
    barangay_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    alt_name: DataTypes.STRING,
    short_name: DataTypes.STRING,
    admin_leve: DataTypes.STRING,
    boundary: DataTypes.STRING,
    max: DataTypes.DECIMAL,
    mean: DataTypes.DECIMAL,
    min: DataTypes.DECIMAL,
    mean_norm: DataTypes.DECIMAL,
    population: DataTypes.INTEGER,
    population_source: DataTypes.STRING,
    type: DataTypes.STRING,
    wikidata: DataTypes.STRING,
    ref: DataTypes.INTEGER,
    old_ref: DataTypes.STRING,
    geojson: DataTypes.JSON,
  }, {
    sequelize,
    modelName: 'Slope',
    tableName: 'Slopes',
    underscored: true,
  });
  return Slope;
};