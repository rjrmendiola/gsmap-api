const express = require('express');
const router = express.Router();
const pool = require('../db');
const { BarangayOfficial } = require('../models');
const { Op } = require('sequelize');
const { dataUpload } = require('../config/multer.config');
const { importBarangayOfficialData } = require('../controllers/barangay-official.controller');

// Get all barangay officials
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
      // return all barangay officials without pagination
      const { Barangay } = require('../models');
      const barangayofficials = await BarangayOfficial.findAll({
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

      return res.json(barangayofficials);
    }

    const { count, rows } = await BarangayOfficial.findAndCountAll({
      where,
      order: [['name', 'ASC'], ['createdAt', 'DESC']],
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

// Add a new barangay official
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

router.post('/import', dataUpload.single('file'), importBarangayOfficialData);

module.exports = router;
