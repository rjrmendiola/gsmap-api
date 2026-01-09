'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('barangays', 'municipality_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow nulls initially since existing records won't have this value
      // references: {
      //   model: 'municipalities',
      //   key: 'id'
      // },
      // onUpdate: 'CASCADE',
      // onDelete: 'RESTRICT',
      after: 'longitude' // position the new column after 'longitude'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('barangays', 'municipality_id');
  }
};
