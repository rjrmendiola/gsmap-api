const express = require('express');
const router = express.Router();
const testDataController = require('../controllers/test-data.controller');
const realtimeDemoController = require('../controllers/realtime-demo.controller');

/**
 * Test Data Routes
 * For generating mock data to test DSS functionality
 */

// Generate mock weather data with varied alert levels
router.post('/weather/generate', testDataController.generateMockWeatherData);

// Generate extreme weather scenario (all barangays at critical level)
router.post('/weather/extreme', testDataController.generateExtremeWeather);

// Clear all mock weather data
router.delete('/weather/clear', testDataController.clearMockWeatherData);

// Trigger weather event (for real-time demo)
router.post('/weather/trigger', testDataController.triggerWeatherEvent);

// Chaos mode - extreme dramatic changes
router.post('/weather/chaos/enable', testDataController.enableChaosMode);
router.post('/weather/chaos/disable', testDataController.disableChaosMode);

// Manual demo controls (for immediate visible changes)
router.post('/demo/cycle', realtimeDemoController.cycleScenario);
router.post('/demo/randomize', realtimeDemoController.randomize);

// Manual Demo for Different Rainfall Advisories
router.post('/demo/rainfall/yellow', realtimeDemoController.yellowRainfall);
router.post('/demo/rainfall/orange', realtimeDemoController.orangeRainfall);
router.post('/demo/rainfall/red', realtimeDemoController.redRainfall);

module.exports = router;
