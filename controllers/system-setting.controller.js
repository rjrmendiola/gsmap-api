const { SystemSetting } = require('../models');

async function getSetting(req, res) {
  const setting = await SystemSetting.findOne();
  res.json({ success: true, data: setting });
}

async function updateSetting(req, res) {
  const { refresh_interval_minutes } = req.body;
  if (!Number.isInteger(refresh_interval_minutes) || refresh_interval_minutes < 1) {
    return res.status(400).json({ error: 'Invalid refresh interval (minutes)' });
  }

  let setting = await SystemSetting.findOne();
  if (!setting) {
    setting = await SystemSetting.create({ refresh_interval_minutes });
  } else {
    setting.refresh_interval_minutes = refresh_interval_minutes;
    await setting.save();
  }

  res.json({ success: true, data: setting });
}

module.exports = { getSetting, updateSetting };
