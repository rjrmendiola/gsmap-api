'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BarangayProfile extends Model {
    static associate(models) {
      // a barangay profile belongs to a barangay
      BarangayProfile.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay'
      });
    }
  }
  BarangayProfile.init({
    barangay_id: DataTypes.INTEGER,
    area: DataTypes.DECIMAL(10, 4),
    population_density: DataTypes.DECIMAL(10, 2),
    livelihood: DataTypes.STRING,
    population: DataTypes.INTEGER,
    max_slope: DataTypes.DECIMAL(12, 8),
    mean_slope: DataTypes.DECIMAL(12, 8),
  }, {
    sequelize,
    modelName: 'BarangayProfile',
    tableName: 'barangay_profiles',
    underscored: true,
  });
  return BarangayProfile;
};