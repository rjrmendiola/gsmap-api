'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Slope, BarangayProfile } = require('../models');

    const slopes = await Slope.findAll({
      attributes: ['id', 'barangay_id', 'population', 'max', 'mean'],
    });

    for (const slope of slopes) {
      await BarangayProfile.update(
        {
          population: slope.population,
          max_slope: slope.max,
          mean_slope: slope.mean
        },
        {
          where: { barangay_id: slope.barangay_id },
          timestamps: false
        }
      );
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'barangay_profiles',
      {
        population: null,
        max_slope: null,
        mean_slope: null
      },
      {},
      { timestamps: false }
    );
  }
};
