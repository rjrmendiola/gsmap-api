const express = require('express');
const router = express.Router();
const pool = require('../db');
const { Barangay } = require('../models');
const { Op } = require('sequelize');

// Get all barangays
router.get('/', async (req, res) => {
  try {
    console.log('teeeeest');
    // const [rows] = await pool.query('SELECT * FROM barangays');
    // res.json(rows);
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Barangay.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
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
// router.post('/', async (req, res) => {
//   const { name, slug } = req.body;
//   try {
//     const [result] = await pool.query(
//       'INSERT INTO barangays (name, slug) VALUES (?, ?)',
//       [name, slug]
//     );
//     res.status(201).json({ id: result.insertId, name, slug });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Update a barangay
// router.put('/:id', async (req, res) => {
//   const { id } = req.params;
//   const { name, slug } = req.body;
//   try {
//     await pool.query(
//       'UPDATE barangays SET name = ?, slug = ? WHERE id = ?',
//       [name, slug, id]
//     );
//     res.json({ id, name, slug });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Delete a barangay
// router.delete('/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     await pool.query('DELETE FROM barangays WHERE id = ?', [id]);
//     res.json({ message: 'Barangay deleted successfully', id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;
