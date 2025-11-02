'use strict';
module.exports = (sequelize, DataTypes) => {
  const Barangay = sequelize.define('Barangay', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    latitude: DataTypes.DECIMAL(10, 7),
    longitude: DataTypes.DECIMAL(10, 7),
  }, {});

  Barangay.associate = function(models) {
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
  };

  return Barangay;
};
