const express = require('express');
const router = express.Router();
const pool = require('../db');
const { Barangay } = require('../models');
const { Op } = require('sequelize');
const slugify = require('slugify');

// Get all barangays
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50, all = false } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    if (all === 'true') {
      // 👇 return all barangays without pagination
      const barangays = await Barangay.findAll({
        where,
        order: [['name', 'ASC'], ['createdAt', 'DESC']],
      });

      return res.json(barangays);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Barangay.findAndCountAll({
      where,
      order: [['name', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      barangays: rows,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new barangay
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    const slug = slugify(name, { lower: true, strict: true, replacement: '_' });
    const barangay = await Barangay.create({ name, slug });
    res.status(201).json(barangay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a barangay
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const barangay = await Barangay.findByPk(req.params.id);
    if (!barangay) return res.status(404).json({ error: 'Not found' });

    const slug = slugify(name, { lower: true, strict: true, replacement: '_' });

    await barangay.update({ name, slug });
    res.json(barangay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a barangay
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const barangay = await Barangay.findByPk(req.params.id);
    if (!barangay) return res.status(404).json({ error: 'Not found' });

    await barangay.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
