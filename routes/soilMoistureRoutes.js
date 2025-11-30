const express = require('express');
const router = express.Router();
const { SoilMoisture } = require('../models');

router.get('/geojson', async (req, res) => {
    try {
      const rows = await SoilMoisture.findAll();

      const geojson = {
        type: "FeatureCollection",
        features: rows.map(row => ({
          type: "Feature",
          geometry: row.geojson,
          properties: {
            id: row.id,
            name: row.name,
            alt_name: row.alt_name,
            short_name: row.short_name,
            admin_level: row.admin_leve,
            boundary: row.boundary,
            mean: row.mean,
            mean_norm: row.mean_norm,
            population: row.population,
            population_source: row.population_source,
            type: row.type,
            wikidata: row.wikidata,
            ref: row.ref,
            old_ref: row.old_ref
          }
        }))
      };

      res.json(geojson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to load soil moisture GeoJSON" });
    }
  });

module.exports = router;