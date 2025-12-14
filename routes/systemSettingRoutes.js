const express = require('express');
const router = express.Router();
// const { WeatherSetting } = require('../models');
const SystemSettingController = require('../controllers/systemSettingController');

router.get('/', SystemSettingController.getSetting);
router.put('/', SystemSettingController.updateSetting);

module.exports = router;