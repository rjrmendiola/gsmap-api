'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HazardRiskAssessment extends Model {
    static associate(models) {
      // each assessment belongs to a barangay
      HazardRiskAssessment.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay'
      });
    }
  }
  HazardRiskAssessment.init({
    barangay_id: DataTypes.INTEGER,
    latitude: DataTypes.DECIMAL(10, 7),
    longitude: DataTypes.DECIMAL(10, 7),
    flood_risk: DataTypes.DECIMAL,
    flood_level: DataTypes.STRING,
    landslide_risk: DataTypes.DECIMAL,
    landslide_level: DataTypes.STRING,
    remarks: DataTypes.JSON,
    recommendations: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'HazardRiskAssessment',
  });

  return HazardRiskAssessment;
};