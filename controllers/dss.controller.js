const dssAlertService = require('../services/dss-alert.service');
const decisionRulesService = require('../services/decision-rules.service');
const evacuationPlannerService = require('../services/evacuation-planner.service');
const riskScoringService = require('../services/risk-scoring.service');
const weatherCacheService = require('../services/weather-cache.service');

/**
 * DSS Controller
 * Handles Decision Support System endpoints
 */

/**
 * Get current alerts for all barangays
 */
exports.getAlerts = async (req, res) => {
  try {
    // Get latest weather data
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();

    if (!weatherData) {
      return res.status(503).json({
        error: 'Weather data not available',
        message: 'Please try again in a few moments'
      });
    }

    // Generate alerts
    const alerts = await dssAlertService.generateAlerts(weatherData);

    // Get statistics
    const statistics = dssAlertService.getAlertStatistics(alerts);

    res.json({
      success: true,
      data: {
        alerts,
        statistics,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      error: 'Failed to generate alerts',
      message: error.message
    });
  }
};

/**
 * Get test/demo alerts with all alert levels for testing
 * Use this endpoint to test the Alert Dashboard with sample data
 */
exports.getTestAlerts = async (req, res) => {
  try {
    const testAlerts = [
      {
        barangayId: 1,
        barangayName: 'Test Barangay - Critical',
        alertLevel: { level: 'RED', severity: 4, description: 'Critical - Immediate Action Required' },
        weatherSummary: { rainfall: 180, soilMoisture: 0.92, windSpeed: 45, temperature: 28 },
        risks: {
          flood: {
            level: 'EXTREME',
            alertLevel: { level: 'RED', severity: 4 },
            reasons: ['Extremely heavy rainfall (180mm)', 'Soil fully saturated (92%)', 'Located in high flood hazard zone']
          },
          landslide: {
            level: 'HIGH',
            alertLevel: { level: 'ORANGE', severity: 3 },
            reasons: ['Steep slopes present', 'Heavy rainfall continues', 'Soil moisture critical']
          },
          wind: {
            level: 'HIGH',
            alertLevel: { level: 'ORANGE', severity: 3 },
            reasons: ['Wind speed 45 kph - dangerous conditions']
          }
        },
        recommendations: [
          'EVACUATE IMMEDIATELY - Flood risk is extreme',
          'Move to higher ground NOW',
          'Activate emergency response team',
          'Close all roads in affected areas',
          'Prepare emergency shelters'
        ],
        generatedAt: new Date()
      },
      {
        barangayId: 2,
        barangayName: 'Test Barangay - High Priority',
        alertLevel: { level: 'ORANGE', severity: 3, description: 'High Priority - Prepare to Evacuate' },
        weatherSummary: { rainfall: 120, soilMoisture: 0.80, windSpeed: 30, temperature: 27 },
        risks: {
          flood: {
            level: 'HIGH',
            alertLevel: { level: 'ORANGE', severity: 3 },
            reasons: ['Heavy rainfall (120mm)', 'Soil highly saturated (80%)', 'Flood-prone area']
          },
          landslide: {
            level: 'MODERATE',
            alertLevel: { level: 'YELLOW', severity: 2 },
            reasons: ['Moderate slopes', 'Heavy rainfall ongoing']
          },
          wind: {
            level: 'MODERATE',
            alertLevel: { level: 'YELLOW', severity: 2 },
            reasons: ['Wind speed 30 kph - monitor closely']
          }
        },
        recommendations: [
          'Prepare evacuation plans',
          'Alert residents in low-lying areas',
          'Monitor weather updates continuously',
          'Pre-position emergency supplies',
          'Standby emergency response teams'
        ],
        generatedAt: new Date()
      },
      {
        barangayId: 3,
        barangayName: 'Test Barangay - Advisory',
        alertLevel: { level: 'YELLOW', severity: 2, description: 'Advisory - Monitor Conditions' },
        weatherSummary: { rainfall: 75, soilMoisture: 0.65, windSpeed: 18, temperature: 26 },
        risks: {
          flood: {
            level: 'MODERATE',
            alertLevel: { level: 'YELLOW', severity: 2 },
            reasons: ['Moderate rainfall (75mm)', 'Soil moderately saturated (65%)']
          },
          landslide: {
            level: 'LOW',
            alertLevel: { level: 'GREEN', severity: 1 },
            reasons: ['Gentle slopes', 'Moderate soil moisture']
          },
          wind: {
            level: 'MODERATE',
            alertLevel: { level: 'YELLOW', severity: 2 },
            reasons: ['Wind speed 18 kph - monitor']
          }
        },
        recommendations: [
          'Monitor weather conditions',
          'Inform residents to stay alert',
          'Check drainage systems',
          'Prepare emergency supplies',
          'Review evacuation routes'
        ],
        generatedAt: new Date()
      },
      {
        barangayId: 4,
        barangayName: 'Test Barangay - Normal',
        alertLevel: { level: 'GREEN', severity: 1, description: 'Normal - No Action Required' },
        weatherSummary: { rainfall: 20, soilMoisture: 0.45, windSpeed: 8, temperature: 25 },
        risks: {
          flood: {
            level: 'LOW',
            alertLevel: { level: 'GREEN', severity: 1 },
            reasons: ['Light rainfall (20mm)', 'Normal soil moisture (45%)']
          },
          landslide: {
            level: 'LOW',
            alertLevel: { level: 'GREEN', severity: 1 },
            reasons: ['Gentle slopes', 'Normal soil conditions']
          },
          wind: {
            level: 'LOW',
            alertLevel: { level: 'GREEN', severity: 1 },
            reasons: ['Wind speed 8 kph - calm conditions']
          }
        },
        recommendations: [
          'Continue routine monitoring',
          'Maintain drainage systems',
          'Regular community preparedness training'
        ],
        generatedAt: new Date()
      }
    ];

    const statistics = {
      total: 4,
      byLevel: {
        RED: 1,
        ORANGE: 1,
        YELLOW: 1,
        GREEN: 1
      }
    };

    res.json({
      success: true,
      data: {
        alerts: testAlerts,
        statistics,
        timestamp: new Date(),
        note: 'This is test data for demonstration purposes'
      }
    });
  } catch (error) {
    console.error('Error generating test alerts:', error);
    res.status(500).json({
      error: 'Failed to generate test alerts',
      message: error.message
    });
  }
};

/**
 * Get alert for specific barangay
 */
exports.getBarangayAlert = async (req, res) => {
  try {
    const { barangayId } = req.params;

    // Get weather data
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();

    if (!weatherData) {
      return res.status(503).json({
        error: 'Weather data not available'
      });
    }

    // Generate all alerts and filter for specific barangay
    const alerts = await dssAlertService.generateAlerts(weatherData);
    const barangayAlert = alerts.find(a => a.barangayId === parseInt(barangayId));

    if (!barangayAlert) {
      return res.status(404).json({
        error: 'Alert not found for this barangay'
      });
    }

    res.json({
      success: true,
      data: barangayAlert
    });
  } catch (error) {
    console.error('Error getting barangay alert:', error);
    res.status(500).json({
      error: 'Failed to get barangay alert',
      message: error.message
    });
  }
};

/**
 * Get decision rules matrix
 */
exports.getDecisionRules = async (req, res) => {
  try {
    const matrix = decisionRulesService.getDecisionMatrix();

    res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    console.error('Error getting decision rules:', error);
    res.status(500).json({
      error: 'Failed to get decision rules',
      message: error.message
    });
  }
};

/**
 * Get triggered decision rules based on current conditions
 */
exports.getTriggeredRules = async (req, res) => {
  try {
    // Get weather data and alerts
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const alerts = await dssAlertService.generateAlerts(weatherData);

    // Get triggered rules for each barangay
    const triggeredByBarangay = alerts.map(alert => {
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
    });

    // Filter only barangays with triggered rules
    const activeRules = triggeredByBarangay.filter(
      br => br.triggeredRules && br.triggeredRules.length > 0
    );

    res.json({
      success: true,
      data: {
        triggeredRules: activeRules,
        summary: {
          totalBarangaysWithRules: activeRules.length,
          totalRulesTriggered: activeRules.reduce(
            (sum, br) => sum + br.triggeredRules.length,
            0
          )
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting triggered rules:', error);
    res.status(500).json({
      error: 'Failed to get triggered rules',
      message: error.message
    });
  }
};

/**
 * Get evacuation plan
 */
exports.getEvacuationPlan = async (req, res) => {
  try {
    // Get current alerts
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    let alerts = await dssAlertService.generateAlerts(weatherData);

    // If no alerts (no weather data), create default GREEN alerts for all barangays
    if (!alerts || alerts.length === 0) {
      const { Barangay } = require('../models');
      const barangays = await Barangay.findAll();

      alerts = barangays.map(barangay => ({
        barangayId: barangay.id,
        barangayName: barangay.name,
        alertLevel: { level: 'GREEN', priority: 1, severity: 1, label: 'Normal', description: 'No Action Required' },
        weatherSummary: { rainfall: 0, soilMoisture: 0.3, windSpeed: 5, temperature: 25 },
        risks: {
          flood: {
            level: 'LOW',
            alertLevel: { level: 'GREEN', severity: 1, priority: 1 },
            reasons: ['No current threat']
          },
          landslide: {
            level: 'LOW',
            alertLevel: { level: 'GREEN', severity: 1, priority: 1 },
            reasons: ['No current threat']
          },
          wind: {
            level: 'LOW',
            alertLevel: { level: 'GREEN', severity: 1, priority: 1 },
            reasons: ['Calm conditions']
          }
        },
        recommendations: ['Continue routine monitoring']
      }));
    }

    // Create evacuation plan
    const plan = await evacuationPlannerService.createEvacuationPlan(alerts);

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error getting evacuation plan:', error);
    res.status(500).json({
      error: 'Failed to generate evacuation plan',
      message: error.message
    });
  }
};

/**
 * Get evacuation plan for specific barangay
 */
exports.getBarangayEvacuationPlan = async (req, res) => {
  try {
    const { barangayId } = req.params;

    // Get alert for this barangay
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const alerts = await dssAlertService.generateAlerts(weatherData);
    const alert = alerts.find(a => a.barangayId === parseInt(barangayId));

    if (!alert) {
      return res.status(404).json({
        error: 'Barangay not found'
      });
    }

    // Get barangay data
    const { Barangay, EvacuationCenter, BarangayProfile, HazardRiskAssessment } = require('../models');
    const barangay = await Barangay.findByPk(barangayId, {
      include: [
        {
          model: EvacuationCenter,
          as: 'evacuationCenters',
          include: [{ model: require('../models').BarangayOfficial, as: 'official' }]
        },
        { model: BarangayProfile, as: 'barangayProfile' },
        { model: HazardRiskAssessment, as: 'hazardRisk' }
      ]
    });

    if (!barangay) {
      return res.status(404).json({
        error: 'Barangay not found'
      });
    }

    // Create evacuation plan
    const plan = await evacuationPlannerService.createBarangayEvacuationPlan(barangay, alert);

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error getting barangay evacuation plan:', error);
    res.status(500).json({
      error: 'Failed to generate evacuation plan',
      message: error.message
    });
  }
};

/**
 * Get evacuation status
 */
exports.getEvacuationStatus = async (req, res) => {
  try {
    const status = await evacuationPlannerService.getEvacuationStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting evacuation status:', error);
    res.status(500).json({
      error: 'Failed to get evacuation status',
      message: error.message
    });
  }
};

/**
 * Get risk scores for all barangays
 */
exports.getRiskScores = async (req, res) => {
  try {
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();

    // Get custom weights if provided
    const customWeights = req.body.weights || null;

    const scores = await riskScoringService.calculateAllRiskScores(weatherData, customWeights);

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('Error calculating risk scores:', error);
    res.status(500).json({
      error: 'Failed to calculate risk scores',
      message: error.message
    });
  }
};

/**
 * Get risk score for specific barangay
 */
exports.getBarangayRiskScore = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const customWeights = req.body.weights || null;

    const allScores = await riskScoringService.calculateAllRiskScores(weatherData, customWeights);
    const barangayScore = allScores.scores.find(s => s.barangayId === parseInt(barangayId));

    if (!barangayScore) {
      return res.status(404).json({
        error: 'Risk score not found for this barangay'
      });
    }

    res.json({
      success: true,
      data: barangayScore
    });
  } catch (error) {
    console.error('Error getting barangay risk score:', error);
    res.status(500).json({
      error: 'Failed to get risk score',
      message: error.message
    });
  }
};

/**
 * Compare risk scenarios with different weights
 */
exports.compareScenarios = async (req, res) => {
  try {
    const { scenarios } = req.body;

    if (!scenarios || !Array.isArray(scenarios)) {
      return res.status(400).json({
        error: 'Scenarios array is required',
        example: {
          scenarios: [
            {
              name: 'Equal weights',
              weights: { floodHazard: 0.17, landslideHazard: 0.17, currentWeather: 0.17, populationDensity: 0.17, vulnerability: 0.17, infrastructure: 0.15 }
            },
            {
              name: 'Flood priority',
              weights: { floodHazard: 0.40, landslideHazard: 0.20, currentWeather: 0.20, populationDensity: 0.10, vulnerability: 0.05, infrastructure: 0.05 }
            }
          ]
        }
      });
    }

    const weatherData = await weatherCacheService.getWeatherForAllBarangays();
    const comparison = await riskScoringService.compareScenarios(weatherData, scenarios);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    res.status(500).json({
      error: 'Failed to compare scenarios',
      message: error.message
    });
  }
};

/**
 * Get comprehensive DSS dashboard data
 */
exports.getDashboard = async (req, res) => {
  try {
    // Get all DSS data in parallel
    const weatherData = await weatherCacheService.getWeatherForAllBarangays();

    const [alerts, riskScores, decisionMatrix, evacuationStatus] = await Promise.all([
      dssAlertService.generateAlerts(weatherData),
      riskScoringService.calculateAllRiskScores(weatherData),
      Promise.resolve(decisionRulesService.getDecisionMatrix()),
      evacuationPlannerService.getEvacuationStatus()
    ]);

    // Generate evacuation plan
    const evacuationPlan = await evacuationPlannerService.createEvacuationPlan(alerts);

    // Get triggered rules
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

    res.json({
      success: true,
      data: {
        alerts: {
          list: alerts,
          statistics: dssAlertService.getAlertStatistics(alerts)
        },
        riskScores: {
          scores: riskScores.scores.slice(0, 10), // Top 10 highest risk
          summary: riskScores.summary
        },
        evacuationPlan,
        triggeredRules: {
          list: triggeredRules.slice(0, 5), // Top 5 barangays with most rules
          count: triggeredRules.length
        },
        evacuationStatus,
        decisionMatrix: {
          totalRules: decisionMatrix.rules.length,
          summary: decisionMatrix.summary
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting DSS dashboard:', error);
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
};
