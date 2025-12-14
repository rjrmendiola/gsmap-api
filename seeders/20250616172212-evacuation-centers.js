'use strict';

const centersData = require('../data/evacuation_centers.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Barangay, BarangayOfficial } = require('../models');
    const timestamp = new Date();

    for (const entry of centersData) {
      const barangay = await Barangay.findOne({ where: { slug: entry.barangay } });

      if (!barangay) {
        console.warn(`Barangay not found for slug: ${entry.barangay}`);
        continue;
      }

      const official = await BarangayOfficial.findOne({
        where: {
          name: entry.punong_barangay,
          barangay_id: barangay.id
        }
      });

      if (!official) {
        console.warn(`Official "${entry.punong_barangay}" not found for barangay "${entry.barangay}"`);
        continue;
      }

      await queryInterface.bulkInsert('evacuation_centers', [{
        name: entry.name,
        barangay_id: barangay.id,
        barangay_official_id: official.id,
        latitude: entry.latitude,
        longitude: entry.longitude,
        venue: entry.venue,
        image: entry.image,
        // created_at: timestamp,
        // updated_at: timestamp
      }]);
    }
  },

  async down (queryInterface, Sequelize) {
    const names = centersData.map(c => c.name);
    await queryInterface.bulkDelete('evacuation_centers', {
      name: names
    });
  }
};
