const express = require('express');
const router = express.Router();
const pool = require('../db');
const { HazardRiskAssessment, Barangay } = require('../models');
const { Op } = require('sequelize');

// Get all hazard risk assessments
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await HazardRiskAssessment.findAndCountAll({
      where,
      order: [['barangay_id', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      officials: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new hazard risk assessment
router.post('/', async (req, res) => {
  const { barangay_id, name, position } = req.body;
  try {
    // const [result] = await pool.query(
    //   'INSERT INTO barangayofficials (barangay_name, name, position) VALUES (?, ?, ?)',
    //   [barangay_name, name, position]
    // );
    // res.status(201).json({ id: result.insertId, barangay_name, name, position });
    const official = await BarangayOfficial.create({ barangay_id, name, position });
    res.status(201).json(official);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a barangay
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { barangay_name, name, position } = req.body;
  try {
    // await pool.query(
    //   'UPDATE barangays SET barangay_name = ?, name = ?, position = ? WHERE id = ?',
    //   [barangay_name, name, position, id]
    // );
    // res.json({ id, barangay_name, name, position });
    const official = await BarangayOfficial.findByPk(req.params.id);
    if (!official) return res.status(404).json({ error: 'Not found' });

    await official.update(req.body);
    res.json(official);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a barangay
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // await pool.query('DELETE FROM barangays WHERE id = ?', [id]);
    // res.json({ message: 'Barangay deleted successfully', id });
    const official = await BarangayOfficial.findByPk(req.params.id);
    if (!official) return res.status(404).json({ error: 'Not found' });

    await official.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export as GeoJSON
router.get('/geojson', async (req, res) => {
  try {
    const assessments = await HazardRiskAssessment.findAll({
      include: [{ model: Barangay, as: 'barangay' }]
    });

    // Convert to GeoJSON FeatureCollection
    const geoJson = {
      type: "FeatureCollection",
      features: assessments.map(assessment => ({
        type: "Feature",
        geometry: {
          type: "Point",  // or "Polygon" if barangay has boundaries
          coordinates: [
            assessment.longitude,
            assessment.latitude
          ]
        },
        properties: {
          id: assessment.id,
          barangay: assessment.barangay.name,
          flood_risk: assessment.flood_risk,
          flood_level: assessment.flood_level,
          landslide_risk: assessment.landslide_risk,
          landslide_level: assessment.landslide_level,
          remarks: assessment.remarks
        }
      }))
    };

    res.json(geoJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
