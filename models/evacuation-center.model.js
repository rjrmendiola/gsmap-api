'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EvacuationCenter extends Model {
    static associate(models) {
      // an evacuation center belongs to a barangay
      EvacuationCenter.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay',
      });

      // an evacuation center belongs to a barangay official
      EvacuationCenter.belongsTo(models.BarangayOfficial, {
        foreignKey: 'barangay_official_id',
        as: 'official',
      });

      EvacuationCenter.hasMany(models.EvacuationCenterImage, {
        foreignKey: 'evacuation_center_id',
        as: 'evacuationCenterImages',
      });
    }
  }
  EvacuationCenter.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    barangay_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    barangay_official_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    latitude: DataTypes.DECIMAL(10, 7),
    longitude: DataTypes.DECIMAL(10, 7),
    venue: DataTypes.STRING,
    image: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'EvacuationCenter',
    tableName: 'evacuation_centers',
    underscored: true,
  });
  return EvacuationCenter;
};
