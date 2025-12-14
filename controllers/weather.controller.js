// const weatherSnapshotService = require('../services/weatherSnapshotService');
const weatherService = require('../services/weather.service');

exports.getAll = async (req, res) => {
  try {
    const data = await weatherService.getAllBarangayWeather();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load weather data' });
  }
};
