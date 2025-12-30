'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Barangay extends Model {
    static associate(models) {
      // a barangay has many officials
      Barangay.hasMany(models.BarangayOfficial, {
        foreignKey: 'barangay_id',
        as: 'officials',
      });

      // a barangay has many evacuation centers
      Barangay.hasMany(models.EvacuationCenter, {
        foreignKey: 'barangay_id',
        as: 'evacuationCenters',
      });

      // a barangay has one hazard risk assessment
      Barangay.hasOne(models.HazardRiskAssessment, {
        foreignKey: 'barangay_id',
        as: 'hazardRisk'
      });

      // a barangay has one soil moisture record
      Barangay.hasOne(models.SoilMoisture, {
        foreignKey: 'barangay_id',
        as: 'soilMoisture'
      });

      // a barangay has one slope record
      Barangay.hasOne(models.Slope, {
        foreignKey: 'barangay_id',
        as: 'slope'
      });

      // a barangay has one barangay profile
      Barangay.hasOne(models.BarangayProfile, {
        foreignKey: 'barangay_id',
        as: 'barangayProfile'
      });

      // a barangay belongs to a municipality
      Barangay.belongsTo(models.Municipality, {
        foreignKey: 'municipality_id',
        as: 'municipality',
      });
    }
  }
  Barangay.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    latitude: DataTypes.DECIMAL(10, 7),
    longitude: DataTypes.DECIMAL(10, 7),
    municipality_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow nulls initially since existing records won't have this value
      // references: {
      //   model: 'municipalities',
      //   key: 'id'
      // },
      // onUpdate: 'CASCADE',
      // onDelete: 'RESTRICT'
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Barangay',
    tableName: 'barangays',
    underscored: true,
  });
  return Barangay;
};
