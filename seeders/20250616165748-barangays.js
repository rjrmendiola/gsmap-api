'use strict';

const barangayData = require('../data/barangays.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Barangay } = require('../models');
    const timestamp = new Date();

    for (const barangay of barangayData) {
      var latitude = barangay.coordinates[0];
      var longitude = barangay.coordinates[1];

      await Barangay.findOrCreate({
        where: { slug: barangay.slug },
        defaults: {
          name: barangay.name,
          latitude: latitude,
          longitude: longitude,
          municipality_id: null,
          // created_at: timestamp,
          // updated_at: timestamp
        }
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const slugs = barangayData.map(b => b.slug);
    await queryInterface.bulkDelete('barangays', {
      slug: slugs
    });
  }
};
