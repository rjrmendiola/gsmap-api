'use strict';

const fs = require('fs');
const Papa = require('papaparse');
// const wellknown = require('wellknown');
const slugify = require('slugify');
const { parseGeometry, deepValidateCoords } = require('../helpers/geometry');
const { parse } = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const file = fs.readFileSync('./data/slopes_2025.csv', 'utf8');
    const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });

    const { Barangay, Slope } = require('../models');

    const rows = [];

    for (const row of parsed.data) {
      var barangaySlug = slugify(row.name, {
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

      // const geometry = parseGeometry(row['.geo']); // returns JS object or null
      // if (geometry) geometry.coordinates = deepValidateCoords(geometry.coordinates);

      // --- FIX START ---
      let geometry = row['.geo'];

      try {
        if (!geometry) return null;

        if (typeof geometry === 'object') return geometry;

        // Case: CSV had a double string → parse again
        if (typeof geometry === 'string') {
          parsed = JSON.parse(geometry);
        }

        geometry = parsed;
      } catch (e) {
        // Case: It’s a raw WKT or custom -> pass to your converter
        geometry = parseGeometry(geometry);
      }
      // --- FIX END ---

      rows.push({
        barangay_id: barangay.id,
        name: row.name,
        alt_name: row.alt_name,
        short_name: row.short_name,
        admin_leve: row.admin_leve,
        boundary: row.boundary,
        max: isNaN(parseFloat(row.max)) ? null : parseFloat(row.max),
        mean: isNaN(parseFloat(row.mean)) ? null : parseFloat(row.mean),
        min: isNaN(parseFloat(row.min)) ? null : parseFloat(row.min),
        mean_norm: isNaN(parseFloat(row.mean_norm)) ? null : parseFloat(row.mean_norm),
        population: isNaN(parseInt(row.population)) ? null : parseInt(row.population),
        population_source: row.source_pop,
        type: row.type,
        wikidata: row.wikidata,
        ref: row.ref,
        old_ref: row.old_ref,
        geojson: geometry,
        // created_at: new Date(),
        // updated_at: new Date()
      });
    }

    // if (rows.length > 0) {
    //   await queryInterface.bulkInsert('Slopes', rows);
    //   // console.log(`Inserted ${rows.length} Slope records`);
    // } else {
    //   console.warn('No valid Slope records to insert');
    // }

    // chunk to avoid huge single call
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await Slope.bulkCreate(chunk, { validate: true }); // uses model; serializes JSON properly
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('slopes', null, {});
  }
};
