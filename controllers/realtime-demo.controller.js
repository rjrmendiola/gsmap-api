const { WeatherSnapshot, Barangay } = require('../models');
const dssAlertService = require('../services/dss-alert.service');
const weatherCacheService = require('../services/weather-cache.service');

/**
 * Demo controller to manually update weather data for testing
 */

/**
 * Cycle through different weather scenarios for demo
 */
let currentScenario = 0;

exports.cycleScenario = async (req, res) => {
  try {
    const barangays = await Barangay.findAll();
    const now = new Date();

    // Define 4 different scenarios to cycle through
    const scenarios = [
      {
        name: 'CALM',
        rainfall: () => Math.random() * 30,
        windSpeed: () => 5 + Math.random() * 10,
        soilMoisture: () => 0.3 + Math.random() * 0.2
      },
      {
        name: 'MODERATE',
        rainfall: () => 50 + Math.random() * 50,
        windSpeed: () => 15 + Math.random() * 15,
        soilMoisture: () => 0.6 + Math.random() * 0.15
      },
      {
        name: 'SEVERE',
        rainfall: () => 100 + Math.random() * 60,
        windSpeed: () => 25 + Math.random() * 15,
        soilMoisture: () => 0.75 + Math.random() * 0.15
      },
      {
        name: 'CRITICAL',
        rainfall: () => 150 + Math.random() * 60,
        windSpeed: () => 35 + Math.random() * 20,
        soilMoisture: () => 0.85 + Math.random() * 0.15
      }
    ];

    // Pick scenario (rotate through them)
    currentScenario = (currentScenario + 1) % scenarios.length;
    const scenario = scenarios[currentScenario];

    // Update all barangays with new scenario
    for (const barangay of barangays) {
      const rainfall = scenario.rainfall();
      const windSpeed = scenario.windSpeed();
      const soilMoisture = scenario.soilMoisture();

      const weatherData = {
        rain: Array(24).fill(0).map(() => rainfall + (Math.random() - 0.5) * 20),
        wind_speed_10m: Array(24).fill(0).map(() => windSpeed + (Math.random() - 0.5) * 5),
        soil_moisture_0_to_1cm: Array(24).fill(0).map(() => soilMoisture + (Math.random() - 0.5) * 0.05),
        soil_moisture_1_to_3cm: Array(24).fill(0).map(() => soilMoisture * 0.95 + (Math.random() - 0.5) * 0.05),
        soil_moisture_3_to_9cm: Array(24).fill(0).map(() => soilMoisture * 0.90 + (Math.random() - 0.5) * 0.05),
        temperature_2m: Array(24).fill(0).map(() => 25 + Math.random() * 5),
        timestamp: now
      };

      // Find or create snapshot
      const [snapshot, created] = await WeatherSnapshot.findOrCreate({
        where: { barangay_id: barangay.id },
        defaults: {
          payload: weatherData,
          fetched_at: now,
          source: 'manual_cycle'
        }
      });

      if (!created) {
        await snapshot.update({
          payload: weatherData,
          fetched_at: now
        });
      }
    }

    // Generate new alerts
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const alerts = await dssAlertService.generateAlerts(weatherData);
    const statistics = dssAlertService.getAlertStatistics(alerts);

    // Emit via WebSocket if available
    const io = req.app.get('io');
    if (io) {
      io.to('dss_room').emit('dss_update', {
        alerts,
        statistics,
        timestamp: now
      });
    }

    res.json({
      success: true,
      message: `Scenario changed to ${scenario.name}`,
      data: {
        scenario: scenario.name,
        statistics,
        barangaysUpdated: barangays.length
      }
    });
  } catch (error) {
    console.error('Error cycling scenario:', error);
    res.status(500).json({
      error: 'Failed to cycle scenario',
      message: error.message
    });
  }
};

/**
 * Randomize all barangay weather dramatically
 */
exports.randomize = async (req, res) => {
  try {
    const barangays = await Barangay.findAll();
    const now = new Date();

    for (const barangay of barangays) {
      // Each barangay gets completely random weather
      const rainfall = Math.random() * 200;
      const windSpeed = Math.random() * 50;
      const soilMoisture = Math.random();

      const weatherData = {
        rain: Array(24).fill(0).map(() => rainfall + (Math.random() - 0.5) * 30),
        wind_speed_10m: Array(24).fill(0).map(() => windSpeed + (Math.random() - 0.5) * 10),
        soil_moisture_0_to_1cm: Array(24).fill(0).map(() => soilMoisture + (Math.random() - 0.5) * 0.1),
        soil_moisture_1_to_3cm: Array(24).fill(0).map(() => soilMoisture * 0.95 + (Math.random() - 0.5) * 0.1),
        soil_moisture_3_to_9cm: Array(24).fill(0).map(() => soilMoisture * 0.90 + (Math.random() - 0.5) * 0.1),
        temperature_2m: Array(24).fill(0).map(() => 25 + Math.random() * 5),
        timestamp: now
      };

      const [snapshot] = await WeatherSnapshot.findOrCreate({
        where: { barangay_id: barangay.id },
        defaults: {
          payload: weatherData,
          fetched_at: now,
          source: 'randomize'
        }
      });

      await snapshot.update({
        payload: weatherData,
        fetched_at: now
      });
    }

    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const alerts = await dssAlertService.generateAlerts(weatherData);
    const statistics = dssAlertService.getAlertStatistics(alerts);

    const io = req.app.get('io');
    if (io) {
      io.to('dss_room').emit('dss_update', {
        alerts,
        statistics,
        timestamp: now
      });
    }

    res.json({
      success: true,
      message: 'Weather randomized for all barangays',
      data: {
        statistics,
        barangaysUpdated: barangays.length
      }
    });
  } catch (error) {
    console.error('Error randomizing weather:', error);
    res.status(500).json({
      error: 'Failed to randomize weather',
      message: error.message
    });
  }
};

/**
 * Set rainfall to Yellow Advisory level (7.5 - 15 MM)
 */
exports.yellowRainfall = async (req, res) => {
  try {
    const barangays = await Barangay.findAll();
    const now = new Date();

    for (const barangay of barangays) {
      // Yellow Rainfall: 7.5 - 15 MM
      const baseRainfall = 7.5 + Math.random() * 7.5; // Range: 7.5 to 15
      const windSpeed = 10 + Math.random() * 10; // Moderate wind
      const soilMoisture = 0.4 + Math.random() * 0.2; // Moderate soil moisture

      const weatherData = {
        rain: Array(24).fill(0).map(() => baseRainfall + (Math.random() - 0.5) * 3),
        wind_speed_10m: Array(24).fill(0).map(() => windSpeed + (Math.random() - 0.5) * 5),
        soil_moisture_0_to_1cm: Array(24).fill(0).map(() => soilMoisture + (Math.random() - 0.5) * 0.05),
        soil_moisture_1_to_3cm: Array(24).fill(0).map(() => soilMoisture * 0.95 + (Math.random() - 0.5) * 0.05),
        soil_moisture_3_to_9cm: Array(24).fill(0).map(() => soilMoisture * 0.90 + (Math.random() - 0.5) * 0.05),
        temperature_2m: Array(24).fill(0).map(() => 25 + Math.random() * 5),
        timestamp: now
      };

      const [snapshot, created] = await WeatherSnapshot.findOrCreate({
        where: { barangay_id: barangay.id },
        defaults: {
          payload: weatherData,
          fetched_at: now,
          source: 'yellow_rainfall_demo'
        }
      });

      if (!created) {
        await snapshot.update({
          payload: weatherData,
          fetched_at: now
        });
      }
    }

    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const alerts = await dssAlertService.generateAlerts(weatherData);
    const statistics = dssAlertService.getAlertStatistics(alerts);

    const io = req.app.get('io');
    if (io) {
      io.to('dss_room').emit('dss_update', {
        alerts,
        statistics,
        timestamp: now
      });
    }

    res.json({
      success: true,
      message: 'Weather set to Yellow Rainfall Advisory (7.5 - 15 MM)',
      data: {
        advisory: 'YELLOW',
        rainfallRange: '7.5 - 15 MM',
        statistics,
        barangaysUpdated: barangays.length
      }
    });
  } catch (error) {
    console.error('Error setting yellow rainfall:', error);
    res.status(500).json({
      error: 'Failed to set yellow rainfall',
      message: error.message
    });
  }
};

/**
 * Set rainfall to Orange Advisory level (15 - 30 MM)
 */
exports.orangeRainfall = async (req, res) => {
  try {
    const barangays = await Barangay.findAll();
    const now = new Date();

    for (const barangay of barangays) {
      // Orange Rainfall: 15 - 30 MM
      const baseRainfall = 15 + Math.random() * 15; // Range: 15 to 30
      const windSpeed = 15 + Math.random() * 15; // Higher wind
      const soilMoisture = 0.6 + Math.random() * 0.15; // Higher soil moisture

      const weatherData = {
        rain: Array(24).fill(0).map(() => baseRainfall + (Math.random() - 0.5) * 5),
        wind_speed_10m: Array(24).fill(0).map(() => windSpeed + (Math.random() - 0.5) * 5),
        soil_moisture_0_to_1cm: Array(24).fill(0).map(() => soilMoisture + (Math.random() - 0.5) * 0.05),
        soil_moisture_1_to_3cm: Array(24).fill(0).map(() => soilMoisture * 0.95 + (Math.random() - 0.5) * 0.05),
        soil_moisture_3_to_9cm: Array(24).fill(0).map(() => soilMoisture * 0.90 + (Math.random() - 0.5) * 0.05),
        temperature_2m: Array(24).fill(0).map(() => 25 + Math.random() * 5),
        timestamp: now
      };

      const [snapshot, created] = await WeatherSnapshot.findOrCreate({
        where: { barangay_id: barangay.id },
        defaults: {
          payload: weatherData,
          fetched_at: now,
          source: 'orange_rainfall_demo'
        }
      });

      if (!created) {
        await snapshot.update({
          payload: weatherData,
          fetched_at: now
        });
      }
    }

    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const alerts = await dssAlertService.generateAlerts(weatherData);
    const statistics = dssAlertService.getAlertStatistics(alerts);

    const io = req.app.get('io');
    if (io) {
      io.to('dss_room').emit('dss_update', {
        alerts,
        statistics,
        timestamp: now
      });
    }

    res.json({
      success: true,
      message: 'Weather set to Orange Rainfall Advisory (15 - 30 MM)',
      data: {
        advisory: 'ORANGE',
        rainfallRange: '15 - 30 MM',
        statistics,
        barangaysUpdated: barangays.length
      }
    });
  } catch (error) {
    console.error('Error setting orange rainfall:', error);
    res.status(500).json({
      error: 'Failed to set orange rainfall',
      message: error.message
    });
  }
};

/**
 * Set rainfall to Red Advisory level (30+ MM)
 */
exports.redRainfall = async (req, res) => {
  try {
    const barangays = await Barangay.findAll();
    const now = new Date();

    for (const barangay of barangays) {
      // Red Rainfall: 30+ MM
      const baseRainfall = 30 + Math.random() * 50; // Range: 30 to 80
      const windSpeed = 25 + Math.random() * 15; // High wind
      const soilMoisture = 0.75 + Math.random() * 0.15; // High soil moisture

      const weatherData = {
        rain: Array(24).fill(0).map(() => baseRainfall + (Math.random() - 0.5) * 10),
        wind_speed_10m: Array(24).fill(0).map(() => windSpeed + (Math.random() - 0.5) * 5),
        soil_moisture_0_to_1cm: Array(24).fill(0).map(() => soilMoisture + (Math.random() - 0.5) * 0.05),
        soil_moisture_1_to_3cm: Array(24).fill(0).map(() => soilMoisture * 0.95 + (Math.random() - 0.5) * 0.05),
        soil_moisture_3_to_9cm: Array(24).fill(0).map(() => soilMoisture * 0.90 + (Math.random() - 0.5) * 0.05),
        temperature_2m: Array(24).fill(0).map(() => 25 + Math.random() * 5),
        timestamp: now
      };

      const [snapshot, created] = await WeatherSnapshot.findOrCreate({
        where: { barangay_id: barangay.id },
        defaults: {
          payload: weatherData,
          fetched_at: now,
          source: 'red_rainfall_demo'
        }
      });

      if (!created) {
        await snapshot.update({
          payload: weatherData,
          fetched_at: now
        });
      }
    }

    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const alerts = await dssAlertService.generateAlerts(weatherData);
    const statistics = dssAlertService.getAlertStatistics(alerts);

    const io = req.app.get('io');
    if (io) {
      io.to('dss_room').emit('dss_update', {
        alerts,
        statistics,
        timestamp: now
      });
    }

    res.json({
      success: true,
      message: 'Weather set to Red Rainfall Advisory (30+ MM)',
      data: {
        advisory: 'RED',
        rainfallRange: '30+ MM',
        statistics,
        barangaysUpdated: barangays.length
      }
    });
  } catch (error) {
    console.error('Error setting red rainfall:', error);
    res.status(500).json({
      error: 'Failed to set red rainfall',
      message: error.message
    });
  }
};


