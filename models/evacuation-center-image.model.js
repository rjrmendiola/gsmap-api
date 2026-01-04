'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EvacuationCenterImage extends Model {
    static associate(models) {
      EvacuationCenterImage.belongsTo(models.EvacuationCenter, {
        foreignKey: 'evacuation_center_id',
        as: 'evacuationCenter'
      });
    }
  }
  EvacuationCenterImage.init({
    evacuation_center_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    image_path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order_index: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'EvacuationCenterImage',
    tableName: 'evacuation_center_images',
    underscored: true,
  });
  return EvacuationCenterImage;
};