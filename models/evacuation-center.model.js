'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EvacuationCenter extends Model {
    static associate(models) {
      EvacuationCenter.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay',
      });

      EvacuationCenter.belongsTo(models.BarangayOfficial, {
        foreignKey: 'barangay_official_id',
        as: 'official',
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
