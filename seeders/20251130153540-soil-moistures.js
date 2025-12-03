'use strict';

const fs = require('fs');
const Papa = require('papaparse');
// const wellknown = require('wellknown');
const slugify = require('slugify');
const { parseGeometry, deepValidateCoords } = require('../helpers/geometry');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const file = fs.readFileSync('./data/soil_moistures_2025.csv', 'utf8');
    const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });

    const { Barangay, SoilMoisture } = require('../models');

    const rows = [];

    for (const row of parsed.data) {
      var barangaySlug = slugify(row.name, { replacement: '_', lower: true, strict: true });

      if (barangaySlug == 'barugohay_sur') {
        barangaySlug = 'baruguhay_sur';
      } else if (barangaySlug == 'paragum') {
        barangaySlug = 'parag_um';
      }

      const barangay = await Barangay.findOne({ where: { slug: barangaySlug } });

      if (!barangay) {
        console.warn(`Barangay not found for slug: ${barangaySlug}`);
        continue; // skip this row
      }

      const geometry = parseGeometry(row['.geo']); // returns JS object or null
      if (geometry) geometry.coordinates = deepValidateCoords(geometry.coordinates);

      rows.push({
        barangay_id: barangay.id,
        name: row.name,
        alt_name: row.alt_name,
        short_name: row.short_name,
        admin_leve: row.admin_leve,
        boundary: row.boundary,
        mean: isNaN(parseFloat(row.mean)) ? null : parseFloat(row.mean),
        mean_norm: isNaN(parseFloat(row.mean_norm)) ? null : parseFloat(row.mean_norm),
        population: isNaN(parseInt(row.population)) ? null : parseInt(row.population),
        population_source: row.source_pop,
        type: row.type,
        wikidata: row.wikidata,
        ref: row.ref ? parseInt(row.ref) : null,
        old_ref: row.old_ref,
        geojson: JSON.stringify(parseGeometry(row['.geo'])),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // if (rows.length > 0) {
    //   await queryInterface.bulkInsert('SoilMoistures', rows);
    //   // console.log(`Inserted ${rows.length} SoilMoisture records`);
    // } else {
    //   console.warn('No valid SoilMoisture records to insert');
    // }

    // chunk to avoid huge single call
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await SoilMoisture.bulkCreate(chunk, { validate: true }); // uses model; serializes JSON properly
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SoilMoistures', null, {});
  }
};
