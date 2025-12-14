'use strict';

const slugify = require('slugify');
const hazardRiskAssessmentData = require('../data/hazard_risk_assessments.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Barangay } = require('../models');
    const timestamp = new Date();

    for (const entry of hazardRiskAssessmentData) {
      var barangaySlug = slugify(entry.barangay, {
        replacement: '_',
        lower: true,
        strict: true
      });

      if (barangaySlug == 'barugohay_sur') {
        barangaySlug = 'baruguhay_sur';
      } else if (barangaySlug == 'paragum') {
        barangaySlug = 'parag_um';
      }

      const barangay = await Barangay.findOne({ where: { slug: barangaySlug } });

      if (!barangay) {
        console.warn(`Barangay not found for slug: ${barangaySlug}`);
        continue;
      }

      var floodLevel = 'Low';
      if (entry.flood_level.includes(',')) {
        var levels = entry.flood_level.split(',');
        if (levels.includes('Moderate')) {
          floodLevel = 'Moderate';
        } else if (levels.includes('High')) {
          floodLevel = 'High';
        }
      }

      var floodRisk = 25;
      if (floodLevel == 'Moderate') {
        floodRisk = 50;
      } else if (floodLevel == 'High') {
        floodRisk = 100;
      }

      var landslideLevel = 'Low';
      if (entry.landslide_level.includes(',')) {
        var levels = entry.landslide_level.split(',');
        if (levels.includes('Moderate')) {
          landslideLevel = 'Moderate';
        } else if (levels.includes('High')) {
          landslideLevel = 'High';
        }
      }

      var landslideRisk = 25;
      if (landslideLevel == 'Moderate') {
        landslideRisk = 50;
      } else if (landslideLevel == 'High') {
        landslideRisk = 100;
      }

      var remarks = entry.remarks.split('.');
      var latitude = entry.coordinates[0];
      var longitude = entry.coordinates[1];

      await queryInterface.bulkInsert('hazard_risk_assessments', [{
        barangay_id: barangay.id,
        latitude: latitude,
        longitude: longitude,
        flood_risk: floodRisk,
        flood_level: floodLevel,
        landslide_risk: landslideRisk,
        landslide_level: landslideLevel,
        remarks: JSON.stringify(remarks),
        recommendations: JSON.stringify(entry.recommendation),
        // created_at: timestamp,
        // updated_at: timestamp
      }]);
    }
  },

  async down (queryInterface, Sequelize) {
    const names = hazardRiskAssessmentData.map(c => c.name);
    await queryInterface.bulkDelete('hazard_risk_assessments', {
      name: names
    });
  }
};
