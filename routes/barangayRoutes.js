const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all barangays
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM barangays');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new barangay
router.post('/', async (req, res) => {
  const { name, slug } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO barangays (name, slug) VALUES (?, ?)',
      [name, slug]
    );
    res.status(201).json({ id: result.insertId, name, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a barangay
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body;
  try {
    await pool.query(
      'UPDATE barangays SET name = ?, slug = ? WHERE id = ?',
      [name, slug, id]
    );
    res.json({ id, name, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a barangay
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM barangays WHERE id = ?', [id]);
    res.json({ message: 'Barangay deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
