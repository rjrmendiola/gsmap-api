'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BarangayProfile extends Model {
    static associate(models) {
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
    livelihood: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BarangayProfile',
    tableName: 'barangay_profiles',
    underscored: true,
  });
  return BarangayProfile;
};