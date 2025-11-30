'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Slopes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      name: {
        type: Sequelize.STRING
      },
      alt_name: {
        type: Sequelize.STRING
      },
      short_name: {
        type: Sequelize.STRING
      },
      admin_leve: {
        type: Sequelize.STRING
      },
      boundary: {
        type: Sequelize.STRING
      },
      max: {
        type: Sequelize.DECIMAL
      },
      mean: {
        type: Sequelize.DECIMAL
      },
      min: {
        type: Sequelize.DECIMAL
      },
      mean_norm: {
        type: Sequelize.DECIMAL
      },
      population: {
        type: Sequelize.INTEGER
      },
      population_source: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      wikidata: {
        type: Sequelize.STRING
      },
      ref: {
        type: Sequelize.INTEGER
      },
      old_ref: {
        type: Sequelize.STRING
      },
      geojson: { 
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Slopes');
  }
};