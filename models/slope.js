'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Slope extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Slope.init({
    barangay_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    alt_name: DataTypes.STRING,
    short_name: DataTypes.STRING,
    admin_leve: DataTypes.STRING,
    boundary: DataTypes.STRING,
    max: DataTypes.DECIMAL,
    mean: DataTypes.DECIMAL,
    min: DataTypes.DECIMAL,
    mean_norm: DataTypes.DECIMAL,
    population: DataTypes.INTEGER,
    population_source: DataTypes.STRING,
    type: DataTypes.STRING,
    wikidata: DataTypes.STRING,
    ref: DataTypes.INTEGER,
    old_ref: DataTypes.STRING,
    geojson: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const value = this.getDataValue('geojson');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('geojson', value ? JSON.stringify(value) : null);
      }
    }
  }, {
    sequelize,
    modelName: 'Slope',
  });
  return Slope;
};