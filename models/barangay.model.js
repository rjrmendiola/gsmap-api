'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Barangay extends Model {
    static associate(models) {
      Barangay.hasMany(models.BarangayOfficial, {
        foreignKey: 'barangay_id',
        as: 'officials',
      });

      Barangay.hasMany(models.EvacuationCenter, {
        foreignKey: 'barangay_id',
        as: 'evacuationCenters',
      });

      Barangay.hasOne(models.HazardRiskAssessment, {
        foreignKey: 'barangay_id',
        as: 'hazardRisk'
      });

      Barangay.hasOne(models.SoilMoisture, {
        foreignKey: 'barangay_id',
        as: 'soilMoisture'
      });

      Barangay.hasOne(models.Slope, {
        foreignKey: 'barangay_id',
        as: 'slope'
      });

      Barangay.hasOne(models.BarangayProfile, {
        foreignKey: 'barangay_id',
        as: 'barangayProfile'
      });
    }
  }
  Barangay.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    latitude: DataTypes.DECIMAL(10, 7),
    longitude: DataTypes.DECIMAL(10, 7),
  }, {
    sequelize,
    modelName: 'Barangay',
    tableName: 'barangays',
    underscored: true,
  });
  return Barangay;
};
