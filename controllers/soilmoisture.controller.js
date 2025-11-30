const { SoilMoisture } = require('../models');

module.exports = {
  // ------------------------
  // SOIL MOISTURE GEOJSON
  // ------------------------
  async getSoilMoistureGeoJSON(req, res) {
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
            admin_level: row.admin_leve,
            mean: row.mean,
            mean_norm: row.mean_norm,
            population: row.population,
            ref: row.ref,
            short_name: row.short_name
          }
        }))
      };

      res.json(geojson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to load soil moisture GeoJSON" });
    }
  },

  // ------------------------
  // COMBINED ENDPOINT: soil moisture + slope
  // ------------------------
//   async getCombinedGeoJSON(req, res) {
//     try {
//       const soilRows = await SoilMoisture.findAll();
//       const slopeRows = await Slope.findAll();

//       const geojson = {
//         type: "FeatureCollection",
//         features: [
//           ...soilRows.map(row => ({
//             type: "Feature",
//             geometry: row.geojson,
//             properties: {
//               type: "soil_moisture",
//               id: row.id,
//               name: row.name,
//               admin_level: row.admin_leve,
//               mean: row.mean,
//               mean_norm: row.mean_norm
//             }
//           })),
//           ...slopeRows.map(row => ({
//             type: "Feature",
//             geometry: row.geojson,
//             properties: {
//               type: "slope",
//               id: row.id,
//               name: row.name,
//               admin_level: row.admin_leve,
//               max: row.max,
//               mean: row.mean,
//               min: row.min
//             }
//           }))
//         ]
//       };

//       res.json(geojson);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Failed to load combined GeoJSON" });
//     }
//   }

};
