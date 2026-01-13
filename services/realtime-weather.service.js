const { WeatherSnapshot, Barangay } = require('../models');
const dssAlertService = require('./dss-alert.service');
const weatherCacheService = require('./weather-cache.service');
const evacuationPlannerService = require('./evacuation-planner.service');
const decisionRulesService = require('./decision-rules.service');

/**
 * Real-time Weather Simulation Service
 * Simulates weather changes and emits real-time updates via WebSocket
 */
class RealtimeWeatherService {
  constructor() {
    this.io = null;
    this.updateInterval = null;
    this.isRunning = false;
    this.updateFrequency = 10000; // Update every 10 seconds
    this.chaosMode = false; // Extreme dramatic changes for demo
  }

  /**
   * Start the real-time weather simulation
   */
  start(io) {
    if (this.isRunning) {
      console.log('Real-time weather service is already running');
      return;
    }

    this.io = io;
    this.isRunning = true;

    console.log('Starting real-time weather simulation...');

    // Update immediately on start
    this.updateWeather();

    // Then update periodically
    this.updateInterval = setInterval(() => {
      this.updateWeather();
    }, this.updateFrequency);
  }

  /**
   * Stop the real-time weather simulation
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('Real-time weather simulation stopped');
  }

  /**
   * Enable chaos mode for extreme dramatic changes
   */
  enableChaosMode() {
    this.chaosMode = true;
    console.log('🌪️ CHAOS MODE ENABLED - Extreme weather variations activated!');
  }

  /**
   * Disable chaos mode
   */
  disableChaosMode() {
    this.chaosMode = false;
    console.log('Normal weather simulation resumed');
  }

  /**
   * Update weather data and emit to connected clients
   */
  async updateWeather() {
    console.log('[Real-time Service] Starting weather update...');
    try {
      const { Barangay } = require('../models');

      // Check if there's existing weather data
      console.log('[Real-time Service] Fetching barangays...');
      const barangays = await Barangay.findAll();

      if (!barangays || barangays.length === 0) {
        console.log('[Real-time Service] ⚠ No barangays found!');
        return;
      }

      console.log(`[Real-time Service] Found ${barangays.length} barangays`);
      const now = new Date();

      let updatedCount = 0;
      let intensifyCount = 0;
      let weakenCount = 0;
      let fluctuateCount = 0;

      // Update each barangay with varied changes
      for (const barangay of barangays) {
        const snapshot = await WeatherSnapshot.findOne({
          where: { barangay_id: barangay.id }
        });

        if (!snapshot || !snapshot.payload) {
          console.log(`[Real-time Service] ⚠ No snapshot for ${barangay.name}`);
          continue;
        }

        const oldPayload = snapshot.payload;
        updatedCount++;

        // Apply dramatic random changes based on chaos mode
        const intensifyChance = this.chaosMode ? 0.6 : 0.3;
        const weakenChance = this.chaosMode ? 0.4 : 0.3;
        const shouldIntensify = Math.random() < intensifyChance;
        const shouldWeaken = Math.random() < weakenChance;

        // Create NEW payload object (Sequelize JSON field requirement)
        let newPayload;

        if (shouldIntensify) {
          intensifyCount++;
          // Intensify - push toward critical
          const rainfallIncrease = Math.random() * 40; // 0-40mm increase
          const windIncrease = Math.random() * 12; // 0-12 m/s increase
          const soilIncrease = Math.random() * 0.12; // 0-12% increase

          newPayload = {
            rain: oldPayload.rain.map(val => Math.min(220, val + rainfallIncrease)),
            wind_speed_10m: oldPayload.wind_speed_10m.map(val => Math.min(60, val + windIncrease)),
            soil_moisture_0_to_1cm: oldPayload.soil_moisture_0_to_1cm.map(val => Math.min(1, val + soilIncrease)),
            soil_moisture_1_to_3cm: oldPayload.soil_moisture_1_to_3cm.map(val => Math.min(1, val + soilIncrease * 0.9)),
            soil_moisture_3_to_9cm: oldPayload.soil_moisture_3_to_9cm.map(val => Math.min(1, val + soilIncrease * 0.8)),
            temperature_2m: oldPayload.temperature_2m || Array(24).fill(0).map(() => 25 + Math.random() * 5),
            timestamp: now
          };

        } else if (shouldWeaken) {
          weakenCount++;
          // Weaken - push toward normal
          const rainfallDecrease = Math.random() * 35; // 0-35mm decrease
          const windDecrease = Math.random() * 10; // 0-10 m/s decrease
          const soilDecrease = Math.random() * 0.10; // 0-10% decrease

          newPayload = {
            rain: oldPayload.rain.map(val => Math.max(0, val - rainfallDecrease)),
            wind_speed_10m: oldPayload.wind_speed_10m.map(val => Math.max(0, val - windDecrease)),
            soil_moisture_0_to_1cm: oldPayload.soil_moisture_0_to_1cm.map(val => Math.max(0.2, val - soilDecrease)),
            soil_moisture_1_to_3cm: oldPayload.soil_moisture_1_to_3cm.map(val => Math.max(0.2, val - soilDecrease)),
            soil_moisture_3_to_9cm: oldPayload.soil_moisture_3_to_9cm.map(val => Math.max(0.2, val - soilDecrease)),
            temperature_2m: oldPayload.temperature_2m || Array(24).fill(0).map(() => 25 + Math.random() * 5),
            timestamp: now
          };

        } else {
          fluctuateCount++;
          // Random fluctuations
          newPayload = {
            rain: oldPayload.rain.map(val => Math.max(0, val + (Math.random() - 0.5) * 25)),
            wind_speed_10m: oldPayload.wind_speed_10m.map(val => Math.max(0, val + (Math.random() - 0.5) * 8)),
            soil_moisture_0_to_1cm: oldPayload.soil_moisture_0_to_1cm.map(val => Math.max(0, Math.min(1, val + (Math.random() - 0.5) * 0.06))),
            soil_moisture_1_to_3cm: oldPayload.soil_moisture_1_to_3cm.map(val => Math.max(0, Math.min(1, val + (Math.random() - 0.5) * 0.06))),
            soil_moisture_3_to_9cm: oldPayload.soil_moisture_3_to_9cm.map(val => Math.max(0, Math.min(1, val + (Math.random() - 0.5) * 0.06))),
            temperature_2m: oldPayload.temperature_2m || Array(24).fill(0).map(() => 25 + Math.random() * 5),
            timestamp: now
          };
        }

        // Save updated weather with NEW object (critical for Sequelize JSON fields)
        await snapshot.update({
          payload: newPayload,
          fetched_at: now
        });
      }

      console.log(`[Real-time Service] ✓ Updated ${updatedCount} barangays (${intensifyCount} intensified, ${weakenCount} weakened, ${fluctuateCount} fluctuated)`);

      // Generate new alerts
      console.log('[Real-time Service] Generating new alerts...');
      const weatherData = await weatherCacheService.getWeatherForAllBarangays();
      const alerts = await dssAlertService.generateAlerts(weatherData);
      const statistics = dssAlertService.getAlertStatistics(alerts);
      console.log(`[Real-time Service] ✓ Generated ${alerts.length} alerts (RED: ${statistics.byLevel.RED}, ORANGE: ${statistics.byLevel.ORANGE}, YELLOW: ${statistics.byLevel.YELLOW})`);

      // Generate evacuation plans
      const evacuationPlan = await evacuationPlannerService.createEvacuationPlan(alerts);

      // Get triggered decision rules
      const triggeredRules = alerts.map(alert => {
        const conditions = {
          barangayName: alert.barangayName,
          rainfall: alert.weatherSummary.rainfall,
          soilMoisture: alert.weatherSummary.soilMoisture,
          windSpeed: alert.weatherSummary.windSpeed,
          alertLevel: alert.alertLevel.level,
          floodLevel: alert.risks.flood.alertLevel.level,
          landslideLevel: alert.risks.landslide.alertLevel.level
        };
        return decisionRulesService.getRecommendedActions(conditions);
      }).filter(br => br.triggeredRules && br.triggeredRules.length > 0);

      // Emit updates to all connected clients in DSS room
      if (this.io) {
        console.log('[Real-time Service] Broadcasting update via WebSocket...');
        this.io.to('dss_room').emit('dss_update', {
          alerts,
          statistics,
          evacuationPlan,
          triggeredRules: {
            list: triggeredRules.slice(0, 5),
            count: triggeredRules.length
          },
          timestamp: new Date()
        });

        console.log(`[${new Date().toLocaleTimeString()}] ✓ DSS update sent - ${alerts.length} alerts, ${statistics.byLevel.RED} critical`);
      } else {
        console.log('[Real-time Service] ⚠ No WebSocket connection available');
      }
    } catch (error) {
      console.error('[Real-time Service] ✗ ERROR updating weather:', error);
      console.error('[Real-time Service] Stack trace:', error.stack);
    }
  }

  /**
   * OLD METHOD - Not used anymore (kept for reference)
   */
  async simulateWeatherChanges_OLD() {
    try {
      const snapshots = await WeatherSnapshot.findAll();

      for (const snapshot of snapshots) {
        const payload = snapshot.payload;

        if (!payload || !payload.rain) continue;

        // In chaos mode, make EVERYTHING change dramatically
        // Otherwise, randomly select some barangays for dramatic changes (30% chance)
        const shouldIntensify = this.chaosMode ? Math.random() < 0.6 : Math.random() < 0.3;
        const shouldWeaken = this.chaosMode ? Math.random() < 0.4 : Math.random() < 0.3;

        if (shouldIntensify) {
          // Intensify weather (push towards critical levels)
          payload.rain = payload.rain.map(val => {
            const increase = Math.random() * 30; // Big increase: 0-30mm
            return Math.min(200, val + increase);
          });

          payload.wind_speed_10m = payload.wind_speed_10m.map(val => {
            const increase = Math.random() * 10; // 0-10 m/s increase
            return Math.min(50, val + increase);
          });

          payload.soil_moisture_0_to_1cm = payload.soil_moisture_0_to_1cm.map(val => {
            const increase = Math.random() * 0.1; // 0-10% increase
            return Math.min(1, val + increase);
          });

          payload.soil_moisture_1_to_3cm = payload.soil_moisture_1_to_3cm.map(val => {
            const increase = Math.random() * 0.1;
            return Math.min(1, val + increase);
          });

          payload.soil_moisture_3_to_9cm = payload.soil_moisture_3_to_9cm.map(val => {
            const increase = Math.random() * 0.1;
            return Math.min(1, val + increase);
          });

        } else if (shouldWeaken) {
          // Weaken weather (push towards normal levels)
          payload.rain = payload.rain.map(val => {
            const decrease = Math.random() * 20; // 0-20mm decrease
            return Math.max(0, val - decrease);
          });

          payload.wind_speed_10m = payload.wind_speed_10m.map(val => {
            const decrease = Math.random() * 8; // 0-8 m/s decrease
            return Math.max(0, val - decrease);
          });

          payload.soil_moisture_0_to_1cm = payload.soil_moisture_0_to_1cm.map(val => {
            const decrease = Math.random() * 0.08; // 0-8% decrease
            return Math.max(0.2, val - decrease);
          });

          payload.soil_moisture_1_to_3cm = payload.soil_moisture_1_to_3cm.map(val => {
            const decrease = Math.random() * 0.08;
            return Math.max(0.2, val - decrease);
          });

          payload.soil_moisture_3_to_9cm = payload.soil_moisture_3_to_9cm.map(val => {
            const decrease = Math.random() * 0.08;
            return Math.max(0.2, val - decrease);
          });

        } else {
          // Small random fluctuations (normal variation)
          payload.rain = payload.rain.map(val => {
            const change = (Math.random() - 0.5) * 15; // ±7.5mm
            return Math.max(0, val + change);
          });

          payload.wind_speed_10m = payload.wind_speed_10m.map(val => {
            const change = (Math.random() - 0.5) * 6; // ±3 m/s
            return Math.max(0, val + change);
          });

          payload.soil_moisture_0_to_1cm = payload.soil_moisture_0_to_1cm.map(val => {
            const change = (Math.random() - 0.5) * 0.04; // ±0.02
            return Math.max(0, Math.min(1, val + change));
          });

          payload.soil_moisture_1_to_3cm = payload.soil_moisture_1_to_3cm.map(val => {
            const change = (Math.random() - 0.5) * 0.04;
            return Math.max(0, Math.min(1, val + change));
          });

          payload.soil_moisture_3_to_9cm = payload.soil_moisture_3_to_9cm.map(val => {
            const change = (Math.random() - 0.5) * 0.04;
            return Math.max(0, Math.min(1, val + change));
          });
        }

        // Update timestamp
        payload.timestamp = new Date();

        // Save updated weather
        await snapshot.update({
          payload: payload,
          fetched_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error simulating weather changes:', error);
    }
  }

  /**
   * Trigger a specific weather event
   */
  async triggerEvent(eventType) {
    try {
      const snapshots = await WeatherSnapshot.findAll();

      for (const snapshot of snapshots) {
        const payload = snapshot.payload;

        if (!payload || !payload.rain) continue;

        switch (eventType) {
          case 'HEAVY_RAIN':
            payload.rain = payload.rain.map(() => 150 + Math.random() * 50);
            payload.soil_moisture_0_to_1cm = payload.soil_moisture_0_to_1cm.map(() => 0.85 + Math.random() * 0.15);
            break;

          case 'STRONG_WIND':
            payload.wind_speed_10m = payload.wind_speed_10m.map(() => 35 + Math.random() * 20);
            break;

          case 'CALM':
            payload.rain = payload.rain.map(() => Math.random() * 20);
            payload.wind_speed_10m = payload.wind_speed_10m.map(() => 5 + Math.random() * 5);
            payload.soil_moisture_0_to_1cm = payload.soil_moisture_0_to_1cm.map(() => 0.3 + Math.random() * 0.2);
            break;
        }

        payload.timestamp = new Date();
        await snapshot.update({
          payload: payload,
          fetched_at: new Date()
        });
      }

      // Immediately update and emit
      await this.updateWeather();

      return { success: true, event: eventType };
    } catch (error) {
      console.error('Error triggering event:', error);
      throw error;
    }
  }
}

module.exports = new RealtimeWeatherService();
