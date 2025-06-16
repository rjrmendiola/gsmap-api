'use strict';

const barangayData = require('../data/barangays.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Barangay } = require('../models');
    const timestamp = new Date();

    for (const barangay of barangayData) {
      await Barangay.findOrCreate({
        where: { slug: barangay.slug },
        defaults: {
          name: barangay.name,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const slugs = barangayData.map(b => b.slug);
    await queryInterface.bulkDelete('Barangays', {
      slug: slugs
    });
  }
};
