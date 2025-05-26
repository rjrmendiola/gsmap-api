const express = require('express');
const router = express.Router();
const pool = require('../db');
const { BarangayOfficial } = require('../models');

// Get all barangay officials
router.get('/', async (req, res) => {
  try {
    // const [rows] = await pool.query('SELECT * FROM barangayofficials');
    // res.json(rows);
    const officials = await BarangayOfficial.findAll();
    res.json(officials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new barangay official
router.post('/', async (req, res) => {
  const { barangay_name, name, position } = req.body;
  try {
    // const [result] = await pool.query(
    //   'INSERT INTO barangayofficials (barangay_name, name, position) VALUES (?, ?, ?)',
    //   [barangay_name, name, position]
    // );
    // res.status(201).json({ id: result.insertId, barangay_name, name, position });
    const official = await BarangayOfficial.create({ barangay_name, name, position });
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

module.exports = router;
