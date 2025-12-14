const { Barangay, SoilMoisture } = require('../models');

// ------------------------
// GEOJSON ENDPOINT
// ------------------------
async function getSoilMoistureGeoJSON(req, res) {
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
}

// ------------------------
// BASELINE ENDPOINT
// ------------------------
async function getBaselines(req, res) {
  try {
    // const rows = await SoilMoisture.findAll({
    //   attributes: ['id', 'name', 'mean', 'mean_norm']
    // });
    // res.json(rows);
    const rows = await SoilMoisture.findAll({
      attributes: ['mean', 'mean_norm'],
      include: [
        {
          model: Barangay,
          as: 'barangay',
          attributes: ['name']
        }
      ]
    });

    const data = rows.map(row => ({
      barangay: row.barangay.name,
      mean: row.mean,
      mean_norm: row.mean_norm
    }));

    return res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load soil moisture baselines" });
  }
}

module.exports = { getSoilMoistureGeoJSON, getBaselines };
