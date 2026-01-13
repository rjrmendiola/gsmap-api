const { WeatherSnapshot, Barangay } = require('../models');
const realtimeWeatherService = require('../services/realtime-weather.service');

/**
 * Test Data Controller
 * Creates mock data for testing DSS functionality
 */

/**
 * Generate mock weather data for all barangays
 * Creates varied data to trigger different alert levels
 */
exports.generateMockWeatherData = async (req, res) => {
  try {
    const barangays = await Barangay.findAll();

    if (barangays.length === 0) {
      return res.status(404).json({
        error: 'No barangays found',
        message: 'Please ensure barangays are loaded in the database'
      });
    }

    // Delete existing weather snapshots to start fresh
    await WeatherSnapshot.destroy({ where: {} });

    const mockData = [];
    const now = new Date();

    // Create different weather scenarios
    const scenarios = [
      // CRITICAL scenarios (RED) - ~10% of barangays
      {
        count: Math.ceil(barangays.length * 0.1),
        data: {
          rainfall: () => 150 + Math.random() * 50,  // 150-200mm
          soil_moisture: () => 0.85 + Math.random() * 0.15,  // 85-100%
          wind_speed: () => 35 + Math.random() * 20,  // 35-55 kph
          temperature: () => 26 + Math.random() * 4
        }
      },
      // HIGH PRIORITY scenarios (ORANGE) - ~15% of barangays
      {
        count: Math.ceil(barangays.length * 0.15),
        data: {
          rainfall: () => 100 + Math.random() * 40,  // 100-140mm
          soil_moisture: () => 0.75 + Math.random() * 0.10,  // 75-85%
          wind_speed: () => 25 + Math.random() * 10,  // 25-35 kph
          temperature: () => 26 + Math.random() * 4
        }
      },
      // ADVISORY scenarios (YELLOW) - ~25% of barangays
      {
        count: Math.ceil(barangays.length * 0.25),
        data: {
          rainfall: () => 50 + Math.random() * 40,  // 50-90mm
          soil_moisture: () => 0.60 + Math.random() * 0.15,  // 60-75%
          wind_speed: () => 15 + Math.random() * 10,  // 15-25 kph
          temperature: () => 25 + Math.random() * 4
        }
      },
      // NORMAL scenarios (GREEN) - remaining barangays
      {
        count: barangays.length,  // Fill remaining
        data: {
          rainfall: () => Math.random() * 40,  // 0-40mm
          soil_moisture: () => 0.3 + Math.random() * 0.25,  // 30-55%
          wind_speed: () => 5 + Math.random() * 10,  // 5-15 kph
          temperature: () => 24 + Math.random() * 5
        }
      }
    ];

    let barangayIndex = 0;

    // Shuffle barangays for random distribution
    const shuffledBarangays = [...barangays].sort(() => Math.random() - 0.5);

    for (const scenario of scenarios) {
      const count = Math.min(scenario.count, shuffledBarangays.length - barangayIndex);

      for (let i = 0; i < count && barangayIndex < shuffledBarangays.length; i++) {
        const barangay = shuffledBarangays[barangayIndex];

        // Generate values
        const rainfallValue = scenario.data.rainfall();
        const soilMoistureValue = scenario.data.soil_moisture();
        const windSpeedValue = scenario.data.wind_speed();
        const tempValue = scenario.data.temperature();

        // Format as arrays (simulating hourly data over 24 hours)
        const weatherData = {
          rain: Array(24).fill(0).map(() => rainfallValue + (Math.random() - 0.5) * 20),
          wind_speed_10m: Array(24).fill(0).map(() => windSpeedValue + (Math.random() - 0.5) * 5),
          soil_moisture_0_to_1cm: Array(24).fill(0).map(() => soilMoistureValue + (Math.random() - 0.5) * 0.05),
          soil_moisture_1_to_3cm: Array(24).fill(0).map(() => soilMoistureValue * 0.95 + (Math.random() - 0.5) * 0.05),
          soil_moisture_3_to_9cm: Array(24).fill(0).map(() => soilMoistureValue * 0.90 + (Math.random() - 0.5) * 0.05),
          temperature_2m: Array(24).fill(0).map(() => tempValue + (Math.random() - 0.5) * 2),
          timestamp: now
        };

        await WeatherSnapshot.create({
          barangay_id: barangay.id,
          payload: weatherData,
          fetched_at: now,
          source: 'test_data'
        });

        mockData.push({
          barangay: barangay.name,
          rainfall: rainfallValue.toFixed(1),
          soilMoisture: (soilMoistureValue * 100).toFixed(1) + '%',
          windSpeed: windSpeedValue.toFixed(1) + ' kph'
        });

        barangayIndex++;
      }
    }

    res.json({
      success: true,
      message: 'Mock weather data generated successfully',
      data: {
        totalBarangays: barangays.length,
        dataGenerated: mockData.length,
        summary: {
          critical: Math.ceil(barangays.length * 0.1),
          highPriority: Math.ceil(barangays.length * 0.15),
          advisory: Math.ceil(barangays.length * 0.25),
          normal: barangays.length - Math.ceil(barangays.length * 0.1) - Math.ceil(barangays.length * 0.15) - Math.ceil(barangays.length * 0.25)
        },
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Error generating mock weather data:', error);
    res.status(500).json({
      error: 'Failed to generate mock weather data',
      message: error.message
    });
  }
};

/**
 * Clear all mock weather data
 */
exports.clearMockWeatherData = async (req, res) => {
  try {
    const deleted = await WeatherSnapshot.destroy({ where: {} });

    res.json({
      success: true,
      message: 'Mock weather data cleared',
      deletedCount: deleted
    });
  } catch (error) {
    console.error('Error clearing mock weather data:', error);
    res.status(500).json({
      error: 'Failed to clear mock weather data',
      message: error.message
    });
  }
};

/**
 * Generate extreme weather scenario (for testing critical alerts)
 */
exports.generateExtremeWeather = async (req, res) => {
  try {
    const barangays = await Barangay.findAll();
    await WeatherSnapshot.destroy({ where: {} });

    const now = new Date();
    const mockData = [];

    for (const barangay of barangays) {
      const rainfallValue = 160 + Math.random() * 50;  // 160-210mm - extreme
      const soilMoistureValue = 0.90 + Math.random() * 0.10;  // 90-100% - saturated
      const windSpeedValue = 40 + Math.random() * 30;  // 40-70 kph - dangerous
      const tempValue = 27 + Math.random() * 3;

      // Format as arrays (simulating hourly data over 24 hours)
      const weatherData = {
        rain: Array(24).fill(0).map(() => rainfallValue + (Math.random() - 0.5) * 20),
        wind_speed_10m: Array(24).fill(0).map(() => windSpeedValue + (Math.random() - 0.5) * 10),
        soil_moisture_0_to_1cm: Array(24).fill(0).map(() => soilMoistureValue + (Math.random() - 0.5) * 0.05),
        soil_moisture_1_to_3cm: Array(24).fill(0).map(() => soilMoistureValue * 0.95 + (Math.random() - 0.5) * 0.05),
        soil_moisture_3_to_9cm: Array(24).fill(0).map(() => soilMoistureValue * 0.90 + (Math.random() - 0.5) * 0.05),
        temperature_2m: Array(24).fill(0).map(() => tempValue + (Math.random() - 0.5) * 2),
        timestamp: now
      };

      await WeatherSnapshot.create({
        barangay_id: barangay.id,
        payload: weatherData,
        fetched_at: now,
        source: 'test_data_extreme'
      });

      mockData.push({
        barangay: barangay.name,
        rainfall: rainfallValue.toFixed(1),
        soilMoisture: (soilMoistureValue * 100).toFixed(1) + '%',
        windSpeed: windSpeedValue.toFixed(1) + ' kph'
      });
    }

    res.json({
      success: true,
      message: 'Extreme weather scenario generated - ALL BARANGAYS AT CRITICAL LEVEL',
      data: {
        totalBarangays: barangays.length,
        scenario: 'EXTREME_WEATHER_EVENT',
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Error generating extreme weather:', error);
    res.status(500).json({
      error: 'Failed to generate extreme weather',
      message: error.message
    });
  }
};

/**
 * Enable chaos mode for dramatic real-time changes
 */
exports.enableChaosMode = (req, res) => {
  try {
    realtimeWeatherService.enableChaosMode();
    res.json({
      success: true,
      message: 'Chaos mode enabled - expect extreme weather variations!',
      mode: 'CHAOS'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to enable chaos mode',
      message: error.message
    });
  }
};

/**
 * Disable chaos mode
 */
exports.disableChaosMode = (req, res) => {
  try {
    realtimeWeatherService.disableChaosMode();
    res.json({
      success: true,
      message: 'Chaos mode disabled - normal simulation resumed',
      mode: 'NORMAL'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to disable chaos mode',
      message: error.message
    });
  }
};

/**
 * Trigger a specific weather event in real-time
 */
exports.triggerWeatherEvent = async (req, res) => {
  try {
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({
        error: 'Event type is required',
        validEvents: ['HEAVY_RAIN', 'STRONG_WIND', 'CALM']
      });
    }

    const validEvents = ['HEAVY_RAIN', 'STRONG_WIND', 'CALM'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({
        error: 'Invalid event type',
        validEvents
      });
    }

    const result = await realtimeWeatherService.triggerEvent(event);

    res.json({
      success: true,
      message: `Weather event ${event} triggered`,
      data: result
    });
  } catch (error) {
    console.error('Error triggering weather event:', error);
    res.status(500).json({
      error: 'Failed to trigger weather event',
      message: error.message
    });
  }
};
