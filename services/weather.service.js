const { WeatherSnapshot, Barangay } = require('../models');
const cache = require('./weather-cache.service');
const { fetchOpenMeteo } = require('./open-meteo.service');

async function getAllBarangayWeather() {
  const barangays = await Barangay.findAll();
  const result = {};

  for (const b of barangays) {
    if (await cache.isFresh(b.id)) {
      const snap = await cache.getSnapshot(b.id);
      result[b.name] = snap.payload;
      continue;
    }

    const data = await fetchOpenMeteo(b.latitude, b.longitude);

    await WeatherSnapshot.create({
      barangay_id: b.id,
      payload: data,
      fetched_at: new Date()
    });

    result[b.name] = data;
  }

  return result;
}

module.exports = {
  getAllBarangayWeather
};
