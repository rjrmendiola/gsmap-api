'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('HazardRiskAssessments', {
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('HazardRiskAssessments');
  }
};