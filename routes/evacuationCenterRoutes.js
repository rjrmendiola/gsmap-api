const express = require('express');
const router = express.Router();
const pool = require('../db');
const { EvacuationCenter } = require('../models');
const { Op } = require('sequelize');

// Get all evacuation centers
router.get('/', async (req, res) => {
  try {
    // const [rows] = await pool.query('SELECT * FROM evacuationcenters');
    // res.json(rows);
    const { search = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { venue: { [Op.like]: `%${search}%` } }
      ];
    }

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

module.exports = router;
