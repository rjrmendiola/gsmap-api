const { WeatherSnapshot, SystemSetting } = require('../models');
const dayjs = require('dayjs');

async function getFetchIntervalMinutes() {
  const row = await SystemSetting.findOne({
    where: { name: 'weather_fetch_interval_minutes' }
  });
  return row ? Number(row.value) : 60;
}

async function isFresh(barangayId) {
  const snapshot = await WeatherSnapshot.findOne({
    where: { barangay_id: barangayId },
    order: [['fetched_at', 'DESC']]
  });

  if (!snapshot) return false;

  const interval = await getFetchIntervalMinutes();
  const age = dayjs().diff(dayjs(snapshot.fetched_at), 'minute');

  return age < interval;
}

async function getSnapshot(barangayId) {
  return WeatherSnapshot.findOne({
    where: { barangay_id: barangayId },
    order: [['fetched_at', 'DESC']]
  });
}

module.exports = {
  isFresh,
  getSnapshot
};
