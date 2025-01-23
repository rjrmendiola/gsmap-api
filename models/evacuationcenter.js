'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EvacuationCenter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  EvacuationCenter.init({
    name: DataTypes.STRING,
    barangay: DataTypes.STRING,
    punong_barangay: DataTypes.STRING,
    latitude: DataTypes.DECIMAL,
    longitude: DataTypes.DECIMAL,
    venue: DataTypes.STRING,
    image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'EvacuationCenter',
  });
  return EvacuationCenter;
};