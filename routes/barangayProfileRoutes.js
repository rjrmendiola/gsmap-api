const express = require('express');
const router = express.Router();
const pool = require('../db');
const { BarangayProfile } = require('../models');
const { Op } = require('sequelize');
const { dataUpload } = require('../config/multer.config');
const { importBarangayProfileData } = require('../controllers/barangay-profile.controller');

// Get all barangay profiles
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20, all = false } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } },
      ];
    }

    if (all === 'true') {
      // return all barangay profiles without pagination
      const { Barangay } = require('../models');
      const barangayProfiles = await BarangayProfile.findAll({
        include: [
          {
            model: Barangay,
            as: 'barangay',
            attributes: ['id', 'name', 'slug'],
          }
        ],
        where,
        order: [['name', 'ASC'], ['createdAt', 'DESC']],
      });

      return res.json(barangayProfiles);
    }

    const { count, rows } = await BarangayProfile.findAndCountAll({
      where,
      order: [['barangay_id', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      profiles: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new barangay profile
router.post('/', async (req, res) => {
  const { barangay_id, area, population, livelihood, max_slope, mean_slope } = req.body;
  try {
    const barangayProfile = await BarangayProfile.findByPk(barangay_id);
    if (barangayProfile) return res.status(409).json({ error: 'Duplicate entries' });
    
    const population_density = population / area;
    barangayProfile = await BarangayProfile.create({ barangay_id, area, population_density, livelihood, population, max_slope, mean_slope });
    res.status(201).json(barangayProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a barangay profile
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { barangay_id, area, population, livelihood, max_slope, mean_slope } = req.body;
  try {
    const barangayProfile = await BarangayProfile.findByPk(req.params.id);
    if (!barangayProfile) return res.status(404).json({ error: 'Not found' });

    await barangayProfile.update(req.body);
    res.json(barangayProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a barangay profile
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const barangayProfile = await BarangayProfile.findByPk(req.params.id);
    if (!barangayProfile) return res.status(404).json({ error: 'Not found' });

    await barangayProfile.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import', dataUpload.single('file'), importBarangayProfileData);

module.exports = router;
