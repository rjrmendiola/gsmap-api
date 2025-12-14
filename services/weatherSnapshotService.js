const axios = require('axios');
const { BarangayWeather, WeatherSetting, Barangay } = require('../models');

async function getOrFetchWeather(barangayId) {
  const setting = await WeatherSetting.findOne();
  const intervalMinutes = setting ? setting.refresh_interval_minutes : 30;

  let record = await BarangayWeather.findOne({ where: { barangay_id: barangayId } });

  const now = new Date();

  if (record) {
    const nextAllowed = new Date(record.fetched_at.getTime() + intervalMinutes * 60000);
    if (now < nextAllowed) {
      // Return cached
      try {
        return JSON.parse(record.weather_json);
      } catch (err) {
        // if parsing fails, fall through to fetch new
      }
    }
  }

  // fetch new data
  const weather = await fetchFromRealWeatherAPI(barangayId);

  if (!record) {
    record = await BarangayWeather.create({
      barangay_id: barangayId,
      weather_json: JSON.stringify(weather),
      fetched_at: now
    });
  } else {
    record.weather_json = JSON.stringify(weather);
    record.fetched_at = now;
    await record.save();
  }

  return weather;
}

async function forceFetchAndSave(barangayId) {
  const now = new Date();
  const weather = await fetchFromRealWeatherAPI(barangayId);
  let record = await BarangayWeather.findOne({ where: { barangay_id: barangayId } });
  if (!record) {
    record = await BarangayWeather.create({
      barangay_id: barangayId,
      weather_json: JSON.stringify(weather),
      fetched_at: now
    });
  } else {
    record.weather_json = JSON.stringify(weather);
    record.fetched_at = now;
    await record.save();
  }
  return weather;
}

/**
 * Replace this with your real API call (API key, endpoint, coordinates)
 */
async function fetchFromRealWeatherAPI(barangayId) {
  // Placeholder: implement your real API call here.
  // Example:
  // const res = await axios.get(`https://api.openweather...&q=${barangayName}`);
  // return res.data;

  // For now simulate:
  return {
    barangay_id: barangayId,
    fetched_at: new Date().toISOString(),
    sample: 'replace with real API response'
  };
}

module.exports = { getOrFetchWeather, forceFetchAndSave };
