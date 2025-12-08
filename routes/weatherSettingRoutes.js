const express = require('express');
const router = express.Router();
const { WeatherSetting } = require('../models');

router.get('/', async (req, res) => {
  try {
    const WeatherSettings = await WeatherSetting.findAll();
    res.json(WeatherSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { refresh_interval_minutes } = req.body;
    const weatherSetting = await WeatherSetting.create({ refresh_interval_minutes });
    res.status(201).json(weatherSetting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { refresh_interval_minutes } = req.body;
    const weatherSetting = await WeatherSetting.findByPk(id);
    if (!weatherSetting) {
      return res.status(404).json({ message: 'Weather setting not found' });
    }
    weatherSetting.refresh_interval_minutes = refresh_interval_minutes;
    await weatherSetting.save();
    res.json(weatherSetting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;