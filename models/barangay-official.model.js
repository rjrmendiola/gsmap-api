'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BarangayOfficial extends Model {
    static associate(models) {
      BarangayOfficial.belongsTo(models.Barangay, {
        foreignKey: 'barangay_id',
        as: 'barangay',
      });

      BarangayOfficial.hasMany(models.EvacuationCenter, {
        foreignKey: 'barangay_official_id',
        as: 'evacuationCenters',
      });
    }
  }
  BarangayOfficial.init({
    barangay_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'BarangayOfficial',
    tableName: 'barangay_officials',
    underscored: true,
  });
  return BarangayOfficial;
};
