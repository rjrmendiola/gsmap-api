const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { User } = require('../models');

const router = express.Router();

// JWT Secret Key (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Login (authenticate and return JWT)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log(email);

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  return res.json({ token });
});


// Logout (client-side handle token deletion)
router.post('/logout', (req, res) => {
  // Since the JWT is stored client-side (e.g., in localStorage), you simply delete it on the client.
  return res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
