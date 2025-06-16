'use strict';

const officialsData = require('../data/barangay_officials.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Barangay } = require('../models');
    const timestamp = new Date();

    for (const entry of officialsData) {
      const barangay = await Barangay.findOne({
        where: { slug: entry.barangay_slug }
      });

      if (barangay) {
        await queryInterface.bulkInsert('BarangayOfficials', [{
          barangay_id: barangay.id,
          name: entry.name,
          position: entry.position,
          createdAt: timestamp,
          updatedAt: timestamp
        }]);
      } else {
        console.warn(`Barangay with slug "${entry.barangay_slug}" not found. Skipping entry.`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    const slugs = officialsData.map(o => o.barangay_slug);
    const { Barangay } = require('../models');

    for (const slug of slugs) {
      const barangay = await Barangay.findOne({ where: { slug } });

      if (barangay) {
        await queryInterface.bulkDelete('BarangayOfficials', {
          barangay_id: barangay.id
        });
      }
    }
  }
};
