'use strict';

const fs = require('fs');
const Papa = require('papaparse');
const wellknown = require('wellknown');
const slugify = require('slugify');

/**
 * Recursively convert all coordinates to numbers
 */
function deepValidateCoords(coords) {
  if (!Array.isArray(coords)) return coords;

  if (typeof coords[0] === 'number') {
    return coords.map(Number); // [lng, lat]
  } else {
    return coords.map(deepValidateCoords);
  }
}

/**
 * Parse raw geometry (GeoJSON string or WKT) into valid GeoJSON
 */
function parseGeometry(raw) {
  if (!raw || raw.trim() === '' || raw === 'None' || raw === 'null') return null;

  try {
    let geometry = raw.trim().startsWith('{') ? JSON.parse(raw) : wellknown(raw);

    if (!geometry || !geometry.type || !geometry.coordinates) return null;

    geometry.coordinates = deepValidateCoords(geometry.coordinates);

    return geometry;
  } catch (err) {
    console.warn('Invalid geometry:', raw);
    return null;
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const file = fs.readFileSync('./data/soil_moistures_2025.csv', 'utf8');
    const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });

    const { Barangay } = require('../models');

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
        // geojson: parseGeometry(row['.geo']),
        geojson: parseGeometry(row['.geo']) ? JSON.stringify(parseGeometry(row['.geo'])) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (rows.length > 0) {
      await queryInterface.bulkInsert('SoilMoistures', rows);
      // console.log(`Inserted ${rows.length} SoilMoisture records`);
    } else {
      console.warn('No valid SoilMoisture records to insert');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SoilMoistures', null, {});
  }
};
