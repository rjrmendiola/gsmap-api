const { Slope } = require('../models');

// ------------------------
// SLOPE GEOJSON
// ------------------------
async function getSlopeGeoJSON(req, res) {
  try {
    const rows = await Slope.findAll();

    const geojson = {
      type: "FeatureCollection",
      features: rows.map(row => ({
        type: "Feature",
        geometry: row.geojson,
        properties: {
          id: row.id,
          name: row.name,
          admin_level: row.admin_leve,
          max: row.max,
          mean: row.mean,
          min: row.min,
          population: row.population,
          ref: row.ref,
          short_name: row.short_name
        }
      }))
    };

    res.json(geojson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load slope GeoJSON" });
  }
}

module.exports = { getSlopeGeoJSON };
