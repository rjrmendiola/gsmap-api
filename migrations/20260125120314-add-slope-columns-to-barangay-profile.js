'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('barangay_profiles', 'max_slope', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('barangay_profiles', 'mean_slope', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('barangay_profiles', 'max_slope');
    await queryInterface.removeColumn('barangay_profiles', 'mean_slope');
  }
};
