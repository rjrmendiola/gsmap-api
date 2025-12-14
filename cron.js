const cron = require('node-cron');
const { Barangay } = require('./models');
const { forceFetchAndSave } = require('./services/weatherService');

/**
 * Runs every day at 02:30 AM server time (change schedule as needed)
 * Cron expr: '30 2 * * *'
 */
cron.schedule('30 2 * * *', async () => {
  console.log('Cron: starting nightly weather refresh job');
  try {
    const barangays = await Barangay.findAll({ attributes: ['id'] });
    for (const b of barangays) {
      try {
        await forceFetchAndSave(b.id);
      } catch (err) {
        console.error('Failed refresh for barangay', b.id, err.message);
      }
    }
    console.log('Cron: nightly weather refresh completed');
  } catch (err) {
    console.error('Cron: failed to fetch barangays', err);
  }
}, {
  scheduled: true
});
