'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.renameColumn('EvacuationCenters', 'barangay_name', 'name');
    await queryInterface.addColumn('EvacuationCenters', 'barangay', {
      type: Sequelize.STRING,
      allowNull: true // Adjust as necessary
    });
    await queryInterface.addColumn('EvacuationCenters', 'punong_barangay', {
      type: Sequelize.STRING,
      allowNull: true // Adjust as necessary
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.renameColumn('EvacuationCenters', 'name', 'barangay_name');
    await queryInterface.removeColumn('EvacuationCenters', 'barangay');
    await queryInterface.removeColumn('EvacuationCenters', 'punong_barangay');
  }
};
