const express = require('express');
const router = express.Router();
const pool = require('../db');
const { EvacuationCenter, BarangayOfficial } = require('../models');
const { Op } = require('sequelize');
const { dataUpload, imageUpload } = require('../config/multer.config');
const { importData, uploadImage, uploadImages, getImages, deleteImage, setPrimaryImage } = require('../controllers/evacuation-center.controller');

// Get all evacuation centers
router.get('/', async (req, res) => {
  try {
    // const [rows] = await pool.query('SELECT * FROM evacuationcenters');
    // res.json(rows);
    const { search = '', page = 1, limit = 50, all = false } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { venue: { [Op.like]: `%${search}%` } }
      ];
    }

    if (all === 'true') {
      // return all evacuation centers without pagination
      const evacuationCenters = await EvacuationCenter.findAll({
        include: [
          {
            model: BarangayOfficial,
            as: 'official',
            attributes: ['id', 'name', 'position'],
          }
        ],
        where,
        order: [['name', 'ASC'], ['createdAt', 'DESC']],
      });

      return res.json(evacuationCenters);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await EvacuationCenter.findAndCountAll({
      where,
      order: [['name', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      centers: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new evacuation center
router.post('/', async (req, res) => {
  const { name, captain_name } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO evacuationcenters (name, captain_name) VALUES (?, ?)',
      [name, captain_name]
    );
    res.status(201).json({ id: result.insertId, name, captain_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a evacuation center
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, captain_name } = req.body;
  try {
    await pool.query(
      'UPDATE evacuationcenters SET name = ?, captain_name = ? WHERE id = ?',
      [name, captain_name, id]
    );
    res.json({ id, name, captain_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a evacuation center
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM evacuationcenters WHERE id = ?', [id]);
    res.json({ message: 'Evacuation center deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import evacuation center data from CSV/Excel file
router.post('/import', dataUpload.single('file'), importData);

// Set a primary image for an evacuation center
router.post('/:evacuation_center_id/set-primary', setPrimaryImage);

// Upload evacuation center image
// router.post('/upload-image', imageUpload.single('file'), uploadImage);
router.post('/:evacuation_center_id/images', imageUpload.array('images', 10), uploadImages);

// Get all images for an evacuation center
router.get('/:evacuation_center_id/images', getImages);

// Delete an evacuation center image
router.delete('/image/:id', deleteImage);

// Get a single evacuation center by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // const [rows] = await pool.query('SELECT * FROM evacuationcenters WHERE id = ?', [id]);
    // if (rows.length === 0) {
    //   return res.status(404).json({ error: 'Evacuation center not found' });
    // }
    const center = await EvacuationCenter.findByPk(id, {
      include: [
        { model: BarangayOfficial, as: 'official', attributes: ['id', 'name', 'position'] }
      ]
    });
    if (!center) {
      return res.status(404).json({ error: 'Evacuation center not found' });
    }
    res.json(center);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
