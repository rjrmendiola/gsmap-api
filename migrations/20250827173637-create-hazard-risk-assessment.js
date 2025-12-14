'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hazard_risk_assessments', {
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
          model: 'barangays',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7)
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7)
      },
      flood_risk: {
        type: Sequelize.DECIMAL
      },
      flood_level: {
        type: Sequelize.STRING
      },
      landslide_risk: {
        type: Sequelize.DECIMAL
      },
      landslide_level: {
        type: Sequelize.STRING
      },
      remarks: {
        type: Sequelize.JSON
      },
      recommendations: {
        type: Sequelize.JSON
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
    await queryInterface.dropTable('hazard_risk_assessments');
  }
};