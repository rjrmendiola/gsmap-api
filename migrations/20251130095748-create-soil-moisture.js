'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SoilMoistures', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      barangay_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Barangays',   // assumes your table is named 'Barangays'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING },
      alt_name: { type: Sequelize.STRING },
      short_name: { type: Sequelize.STRING },
      admin_leve: { type: Sequelize.STRING },
      boundary: { type: Sequelize.STRING },

      mean: { type: Sequelize.FLOAT },
      mean_norm: { type: Sequelize.FLOAT },
      population: { type: Sequelize.INTEGER },
      population_source: { type: Sequelize.STRING },

      type: { type: Sequelize.STRING },
      wikidata: { type: Sequelize.STRING },
      ref: { type: Sequelize.INTEGER },
      old_ref: { type: Sequelize.STRING },
      
      geojson: { 
        type: Sequelize.JSON,
        allowNull: true
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SoilMoistures');
  }
};

