'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BarangayOfficial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BarangayOfficial.init({
    barangay_name: DataTypes.STRING,
    position: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BarangayOfficial',
    timestamps: true
  });
  return BarangayOfficial;
};