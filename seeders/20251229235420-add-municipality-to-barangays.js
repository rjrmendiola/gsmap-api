'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Municipality } = require('../models');

    const municipality = await Municipality.findOne({
      where: { slug: 'carigara' }
    });

    if (!municipality) {
      throw new Error('Municipality "carigara" not found');
    }

    await queryInterface.bulkUpdate(
      'barangays',
      { municipality_id: municipality.id },
      {},
      { timestamps: false }
    );
  },

  async down (queryInterface, Sequelize) {
    // No need to revert the municipality_id assignment
  }
};
