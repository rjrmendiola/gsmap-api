const HOURLY_VARS = [
  'temperature_2m', 'relative_humidity_2m', 'dew_point_2m',
  'apparent_temperature', 'precipitation_probability', 'precipitation',
  'rain', 'showers', 'snowfall', 'snow_depth', 'weather_code',
  'pressure_msl', 'surface_pressure', 'cloudcover', 'cloudcover_low',
  'cloudcover_mid', 'cloudcover_high', 'visibility',
  'evapotranspiration', 'et0_fao_evapotranspiration', 'vapor_pressure_deficit',
  'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m', 'wind_speed_180m',
  'wind_direction_10m', 'wind_direction_80m',
  'wind_direction_120m', 'wind_direction_180m',
  'wind_gusts_10m',
  'temperature_80m', 'temperature_120m', 'temperature_180m',
  'soil_temperature_0cm', 'soil_temperature_6cm',
  'soil_temperature_18cm', 'soil_temperature_54cm',
  'soil_moisture_0_to_1cm', 'soil_moisture_1_to_3cm',
  'soil_moisture_3_to_9cm', 'soil_moisture_9_to_27cm',
  'soil_moisture_27_to_81cm'
];

async function fetchOpenMeteo(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');

  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_VARS.join(','),
    timezone: 'auto'
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Open-Meteo request failed');
  }

  const json = await res.json();
  return parseHourly(json);
}

/**
 * Converts Open-Meteo hourly response into
 * the SAME structure you used in Angular
 */
function parseHourly(response) {
  const { hourly, utc_offset_seconds } = response;

  const timeArray = hourly.time.map(t =>
    new Date((t + utc_offset_seconds) * 1000)
  );

  const data = { time: timeArray };

  for (const key of Object.keys(hourly)) {
    if (key !== 'time') {
      data[key] = hourly[key];
    }
  }

  return data;
}

module.exports = {
  fetchOpenMeteo
};
