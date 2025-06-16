'use strict';
module.exports = (sequelize, DataTypes) => {
  const BarangayOfficial = sequelize.define('BarangayOfficial', {
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
    },
  }, {});

  BarangayOfficial.associate = function(models) {
    BarangayOfficial.belongsTo(models.Barangay, {
      foreignKey: 'barangay_id',
      as: 'barangay',
    });

    BarangayOfficial.hasMany(models.EvacuationCenter, {
      foreignKey: 'barangay_official_id',
      as: 'evacuationCenters',
    });
  };

  return BarangayOfficial;
};
