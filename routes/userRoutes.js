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