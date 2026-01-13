const { Barangay, HazardRiskAssessment, EvacuationCenter, Slope, SoilMoisture } = require('../models');

/**
 * DSS Alert Service
 * Generates real-time alerts based on weather conditions and hazard thresholds
 */
class DSSAlertService {
  constructor() {
    // Alert thresholds - these determine when alerts are triggered
    this.thresholds = {
      rainfall: {
        low: 50,      // mm in 24h - Yellow alert
        moderate: 100, // mm in 24h - Orange alert
        high: 150     // mm in 24h - Red alert
      },
      soilMoisture: {
        low: 0.6,      // 60% saturation - Yellow alert
        moderate: 0.75, // 75% saturation - Orange alert
        high: 0.85    // 85% saturation - Red alert
      },
      windSpeed: {
        low: 15,       // m/s - Yellow alert
        moderate: 25,  // m/s - Orange alert
        high: 35      // m/s - Red alert
      },
      slope: 30       // degrees - landslide risk threshold
    };

    // Alert level definitions
    this.alertLevels = {
      GREEN: { level: 'GREEN', priority: 0, label: 'Low', color: '#10B981' },
      YELLOW: { level: 'YELLOW', priority: 1, label: 'Moderate', color: '#F59E0B' },
      ORANGE: { level: 'ORANGE', priority: 2, label: 'High', color: '#F97316' },
      RED: { level: 'RED', priority: 3, label: 'Very High', color: '#EF4444' }
    };
  }

  /**
   * Generate alerts for all barangays based on current weather
   * @param {Object} weatherData - Weather data for all barangays
   * @returns {Array} Array of alert objects
   */
  async generateAlerts(weatherData) {
    try {
      const alerts = [];

      // Get all barangays with their related data
      const barangays = await Barangay.findAll({
        include: [
          { model: HazardRiskAssessment, as: 'hazardRisk' },
          { model: EvacuationCenter, as: 'evacuationCenters' },
          { model: Slope, as: 'slope' },
          { model: SoilMoisture, as: 'soilMoisture' }
        ]
      });

      for (const barangay of barangays) {
        const barangayWeather = weatherData[barangay.name] || weatherData[barangay.slug];

        if (!barangayWeather) continue;

        const alert = await this.assessBarangay(barangay, barangayWeather);
        if (alert) {
          alerts.push(alert);
        }
      }

      // Sort by priority (highest first)
      alerts.sort((a, b) => b.alertLevel.priority - a.alertLevel.priority);

      return alerts;
    } catch (error) {
      console.error('Error generating alerts:', error);
      throw error;
    }
  }

  /**
   * Assess individual barangay and generate alert
   * @param {Object} barangay - Barangay model instance
   * @param {Object} weather - Weather data for the barangay
   * @returns {Object} Alert object
   */
  async assessBarangay(barangay, weather) {
    const risks = {
      flood: this.assessFloodRisk(weather, barangay.hazardRisk, barangay.slope),
      landslide: this.assessLandslideRisk(weather, barangay.slope, barangay.soilMoisture),
      wind: this.assessWindRisk(weather)
    };

    // Determine overall alert level (highest priority risk)
    const maxAlertLevel = Math.max(
      risks.flood.alertLevel.priority,
      risks.landslide.alertLevel.priority,
      risks.wind.alertLevel.priority
    );

    // Only return alerts for YELLOW and above
    if (maxAlertLevel === 0) return null;

    const alertLevel = Object.values(this.alertLevels).find(
      level => level.priority === maxAlertLevel
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(risks, barangay);

    return {
      barangayId: barangay.id,
      barangayName: barangay.name,
      alertLevel,
      risks,
      recommendations,
      evacuationCenters: barangay.evacuationCenters.map(ec => ({
        id: ec.id,
        name: ec.name,
        venue: ec.venue,
        latitude: ec.latitude,
        longitude: ec.longitude
      })),
      timestamp: new Date(),
      weatherSummary: {
        rainfall: this.getMaxValue(weather.rain),
        windSpeed: this.getMaxValue(weather.wind_speed_10m),
        soilMoisture: this.getMaxSoilMoisture(weather)
      }
    };
  }

  /**
   * Assess flood risk based on slope, rainfall, and soil moisture
   * Uses decision table criteria for risk assessment
   */
  assessFloodRisk(weather, hazardRisk, slopeData) {
    const rainfall = this.getMaxValue(weather.rain); // mm/24h
    const soilMoisture = this.getMaxSoilMoisture(weather); // fraction (0-1)
    const slope = slopeData ? parseFloat(slopeData.mean) : 0; // degrees
    let alertLevel = this.alertLevels.GREEN;
    const reasons = [];

    // Define rainfall categories
    const isModerateRainfall = rainfall >= this.thresholds.rainfall.low && rainfall < this.thresholds.rainfall.moderate; // 50-100mm
    const isHighRainfall = rainfall >= this.thresholds.rainfall.moderate && rainfall < this.thresholds.rainfall.high; // 100-150mm
    const isExtremeRainfall = rainfall >= this.thresholds.rainfall.high; // >= 150mm

    // Define soil moisture categories
    const isMoist = soilMoisture > this.thresholds.soilMoisture.low && soilMoisture <= this.thresholds.soilMoisture.moderate; // >0.6 and <=0.75
    const isSaturated = soilMoisture > this.thresholds.soilMoisture.moderate; // >0.75

    // Apply decision table criteria
    if (slope >= 0 && slope < 2) {
      // Slope 0-2°
      if (isModerateRainfall && isMoist) {
        alertLevel = this.alertLevels.ORANGE;
        reasons.push(`Low slope (${slope.toFixed(1)}°) with moderate rainfall (${rainfall.toFixed(1)}mm) and moist soil (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (isHighRainfall && isSaturated) {
        alertLevel = this.alertLevels.RED;
        reasons.push(`Low slope (${slope.toFixed(1)}°) with high rainfall (${rainfall.toFixed(1)}mm) and saturated soil (${(soilMoisture * 100).toFixed(1)}%) - Critical flood risk`);
      } else if (isExtremeRainfall && isSaturated) {
        alertLevel = this.alertLevels.RED;
        reasons.push(`Low slope (${slope.toFixed(1)}°) with extreme rainfall (${rainfall.toFixed(1)}mm) and saturated soil (${(soilMoisture * 100).toFixed(1)}%) - Very High/Critical flood risk`);
      } else {
        // Fallback for other combinations
        if (isExtremeRainfall || (isHighRainfall && isSaturated)) {
          alertLevel = this.alertLevels.RED;
          reasons.push(`Low slope (${slope.toFixed(1)}°) with high/extreme rainfall (${rainfall.toFixed(1)}mm) and/or saturated conditions`);
        } else if (isHighRainfall || (isModerateRainfall && isSaturated)) {
          alertLevel = this.alertLevels.ORANGE;
          reasons.push(`Low slope (${slope.toFixed(1)}°) with elevated rainfall (${rainfall.toFixed(1)}mm) and/or saturated soil`);
        } else if (isModerateRainfall || isMoist) {
          alertLevel = this.alertLevels.YELLOW;
          reasons.push(`Low slope (${slope.toFixed(1)}°) with moderate rainfall (${rainfall.toFixed(1)}mm) and/or moist soil`);
        } else {
          alertLevel = this.alertLevels.GREEN;
          reasons.push(`Low slope (${slope.toFixed(1)}°) with low flood risk conditions`);
        }
      }
    } else if (slope >= 2 && slope < 5) {
      // Slope 2-5°
      if (isHighRainfall && isSaturated) {
        alertLevel = this.alertLevels.ORANGE;
        reasons.push(`Moderate slope (${slope.toFixed(1)}°) with high rainfall (${rainfall.toFixed(1)}mm) and saturated soil (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (isModerateRainfall && isMoist) {
        alertLevel = this.alertLevels.YELLOW;
        reasons.push(`Moderate slope (${slope.toFixed(1)}°) with moderate rainfall (${rainfall.toFixed(1)}mm) and moist soil (${(soilMoisture * 100).toFixed(1)}%)`);
      } else {
        // Fallback for other combinations
        if (isExtremeRainfall || (isHighRainfall && isSaturated)) {
          alertLevel = this.alertLevels.ORANGE;
          reasons.push(`Moderate slope (${slope.toFixed(1)}°) with high/extreme rainfall (${rainfall.toFixed(1)}mm) and/or saturated conditions`);
        } else if (isHighRainfall || (isModerateRainfall && isSaturated)) {
          alertLevel = this.alertLevels.YELLOW;
          reasons.push(`Moderate slope (${slope.toFixed(1)}°) with elevated rainfall (${rainfall.toFixed(1)}mm) and/or saturated soil`);
        } else if (isModerateRainfall || isMoist) {
          alertLevel = this.alertLevels.YELLOW;
          reasons.push(`Moderate slope (${slope.toFixed(1)}°) with moderate rainfall (${rainfall.toFixed(1)}mm) and/or moist soil`);
        } else {
          alertLevel = this.alertLevels.GREEN;
          reasons.push(`Moderate slope (${slope.toFixed(1)}°) with low flood risk conditions`);
        }
      }
    } else if (slope >= 5 && slope <= 10) {
      // Slope 5-10°
      if (isHighRainfall && isSaturated) {
        alertLevel = this.alertLevels.YELLOW;
        reasons.push(`Steeper slope (${slope.toFixed(1)}°) with high rainfall (${rainfall.toFixed(1)}mm) and saturated soil (${(soilMoisture * 100).toFixed(1)}%)`);
      } else {
        // Fallback for other combinations
        if (isExtremeRainfall) {
          alertLevel = this.alertLevels.YELLOW;
          reasons.push(`Steeper slope (${slope.toFixed(1)}°) with extreme rainfall (${rainfall.toFixed(1)}mm)`);
        } else if (isHighRainfall || isSaturated) {
          alertLevel = this.alertLevels.YELLOW;
          reasons.push(`Steeper slope (${slope.toFixed(1)}°) with elevated rainfall (${rainfall.toFixed(1)}mm) and/or saturated soil`);
        } else {
          alertLevel = this.alertLevels.GREEN;
          reasons.push(`Steeper slope (${slope.toFixed(1)}°) with low flood risk conditions`);
        }
      }
    } else if (slope > 10 && slope <= 15) {
      // Slope >10° and <=15°: Low (local flooding only)
      alertLevel = this.alertLevels.GREEN;
      reasons.push(`Steep slope (${slope.toFixed(1)}°) - low flood risk (local flooding only)`);
    } else if (slope > 15) {
      // Slope >15°: Check for extreme rainfall (flash flood downstream risk)
      if (isExtremeRainfall) {
        alertLevel = this.alertLevels.RED;
        reasons.push(`Very steep slope (${slope.toFixed(1)}°) with extreme rainfall (${rainfall.toFixed(1)}mm) - Flash flood downstream risk`);
      } else {
        alertLevel = this.alertLevels.GREEN;
        reasons.push(`Very steep slope (${slope.toFixed(1)}°) - low flood risk (local flooding only)`);
      }
    }

    // Consider existing flood hazard level as additional factor
    if (hazardRisk && hazardRisk.flood_level) {
      const floodLevel = hazardRisk.flood_level;
      if (floodLevel === 'High' && rainfall > 0 && alertLevel.priority < 3) {
        alertLevel = this.escalateAlert(alertLevel);
        reasons.push('Area is in high flood hazard zone');
      } else if (floodLevel === 'Moderate' && rainfall >= this.thresholds.rainfall.low && alertLevel.priority < 2) {
        alertLevel = this.escalateAlert(alertLevel);
        reasons.push('Area is in moderate flood hazard zone');
      }
    }

    return {
      type: 'FLOOD',
      alertLevel,
      rainfall: rainfall,
      soilMoisture: soilMoisture,
      slope: slope,
      value: rainfall,
      unit: 'mm',
      reasons
    };
  }

  /**
   * Assess landslide risk based on slope, rainfall, and soil moisture
   * Uses decision table criteria for risk assessment
   */
  assessLandslideRisk(weather, slopeData, soilMoistureData) {
    const rainfall = this.getMaxValue(weather.rain); // mm/24h
    const soilMoisture = this.getMaxSoilMoisture(weather); // fraction (0-1)
    const slope = slopeData ? parseFloat(slopeData.max) : 0; // degrees
    let alertLevel = this.alertLevels.GREEN;
    const reasons = [];

    // Apply decision table criteria
    if (slope >= 0 && slope < 5) {
      // Slope 0-5°: Any rainfall, any soil moisture → Low
      alertLevel = this.alertLevels.GREEN;
      reasons.push(`Low slope angle: ${slope.toFixed(1)}° (minimal landslide risk)`);
    } else if (slope >= 5 && slope < 15) {
      // Slope 5-15°
      if (rainfall <= 50 && soilMoisture <= 0.6) {
        alertLevel = this.alertLevels.GREEN;
        reasons.push(`Moderate slope (${slope.toFixed(1)}°) with low rainfall (${rainfall.toFixed(1)}mm) and low soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (rainfall > 50 && rainfall <= 100 && soilMoisture > 0.6 && soilMoisture <= 0.75) {
        alertLevel = this.alertLevels.YELLOW;
        reasons.push(`Moderate slope (${slope.toFixed(1)}°) with moderate rainfall (${rainfall.toFixed(1)}mm) and elevated soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (rainfall > 100 && soilMoisture > 0.75) {
        alertLevel = this.alertLevels.ORANGE;
        reasons.push(`Moderate slope (${slope.toFixed(1)}°) with heavy rainfall (${rainfall.toFixed(1)}mm) and high soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else {
        // For values that don't match exact table conditions, use conservative approach
        // Check which threshold is exceeded and assign appropriate risk level
        const rainfallExceedsModerate = rainfall > 50;
        const rainfallExceedsHigh = rainfall > 100;
        const moistureExceedsModerate = soilMoisture > 0.6;
        const moistureExceedsHigh = soilMoisture > 0.75;

        if (rainfallExceedsHigh || moistureExceedsHigh) {
          alertLevel = this.alertLevels.ORANGE;
          reasons.push(`Moderate slope (${slope.toFixed(1)}°) with heavy rainfall (${rainfall.toFixed(1)}mm) and/or high soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
        } else if (rainfallExceedsModerate || moistureExceedsModerate) {
          alertLevel = this.alertLevels.YELLOW;
          reasons.push(`Moderate slope (${slope.toFixed(1)}°) with elevated rainfall (${rainfall.toFixed(1)}mm) and/or elevated soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
        } else {
          alertLevel = this.alertLevels.GREEN;
          reasons.push(`Moderate slope (${slope.toFixed(1)}°) with low risk conditions`);
        }
      }
    } else if (slope >= 15 && slope <= 25) {
      // Slope 15-25°
      if (rainfall <= 100 && soilMoisture <= 0.75) {
        alertLevel = this.alertLevels.YELLOW;
        reasons.push(`Steep slope (${slope.toFixed(1)}°) with moderate rainfall (${rainfall.toFixed(1)}mm) and moderate soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (rainfall > 100 && rainfall <= 150 && soilMoisture > 0.75 && soilMoisture <= 0.85) {
        alertLevel = this.alertLevels.ORANGE;
        reasons.push(`Steep slope (${slope.toFixed(1)}°) with heavy rainfall (${rainfall.toFixed(1)}mm) and high soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (rainfall > 150 && soilMoisture > 0.85) {
        alertLevel = this.alertLevels.RED;
        reasons.push(`Steep slope (${slope.toFixed(1)}°) with very heavy rainfall (${rainfall.toFixed(1)}mm) and critical soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else {
        // For values that don't match exact table conditions, use conservative approach
        const rainfallExceedsHigh = rainfall > 100;
        const rainfallExceedsVeryHigh = rainfall > 150;
        const moistureExceedsHigh = soilMoisture > 0.75;
        const moistureExceedsVeryHigh = soilMoisture > 0.85;

        if (rainfallExceedsVeryHigh || moistureExceedsVeryHigh) {
          alertLevel = this.alertLevels.RED;
          reasons.push(`Steep slope (${slope.toFixed(1)}°) with very heavy rainfall (${rainfall.toFixed(1)}mm) and/or critical soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
        } else if (rainfallExceedsHigh || moistureExceedsHigh) {
          alertLevel = this.alertLevels.ORANGE;
          reasons.push(`Steep slope (${slope.toFixed(1)}°) with heavy rainfall (${rainfall.toFixed(1)}mm) and/or high soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
        } else {
          alertLevel = this.alertLevels.YELLOW;
          reasons.push(`Steep slope (${slope.toFixed(1)}°) with moderate risk conditions`);
        }
      }
    } else if (slope > 25) {
      // Slope >25°
      if (rainfall <= 100 && soilMoisture <= 0.75) {
        alertLevel = this.alertLevels.ORANGE;
        reasons.push(`Very steep slope (${slope.toFixed(1)}°) with moderate rainfall (${rainfall.toFixed(1)}mm) and moderate soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (rainfall > 100 && rainfall <= 150 && soilMoisture > 0.75 && soilMoisture <= 0.85) {
        alertLevel = this.alertLevels.RED;
        reasons.push(`Very steep slope (${slope.toFixed(1)}°) with heavy rainfall (${rainfall.toFixed(1)}mm) and high soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else if (rainfall > 150 && soilMoisture > 0.85) {
        alertLevel = this.alertLevels.RED;
        reasons.push(`Very steep slope (${slope.toFixed(1)}°) with very heavy rainfall (${rainfall.toFixed(1)}mm) and critical soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
      } else {
        // For values that don't match exact table conditions, use conservative approach
        const rainfallExceedsModerate = rainfall > 100;
        const moistureExceedsModerate = soilMoisture > 0.75;

        if (rainfallExceedsModerate || moistureExceedsModerate) {
          alertLevel = this.alertLevels.RED;
          reasons.push(`Very steep slope (${slope.toFixed(1)}°) with heavy rainfall (${rainfall.toFixed(1)}mm) and/or high soil moisture (${(soilMoisture * 100).toFixed(1)}%)`);
        } else {
          alertLevel = this.alertLevels.ORANGE;
          reasons.push(`Very steep slope (${slope.toFixed(1)}°) with moderate risk conditions`);
        }
      }
    }

    return {
      type: 'LANDSLIDE',
      alertLevel,
      rainfall: rainfall,
      soilMoisture: soilMoisture,
      slope: slope,
      reasons
    };
  }

  /**
   * Assess wind risk
   */
  assessWindRisk(weather) {
    const windSpeed = this.getMaxValue(weather.wind_speed_10m);
    let alertLevel = this.alertLevels.GREEN;
    const reasons = [];

    if (windSpeed >= this.thresholds.windSpeed.high) {
      alertLevel = this.alertLevels.RED;
      reasons.push(`Severe winds: ${windSpeed.toFixed(1)} m/s`);
    } else if (windSpeed >= this.thresholds.windSpeed.moderate) {
      alertLevel = this.alertLevels.ORANGE;
      reasons.push(`Strong winds: ${windSpeed.toFixed(1)} m/s`);
    } else if (windSpeed >= this.thresholds.windSpeed.low) {
      alertLevel = this.alertLevels.YELLOW;
      reasons.push(`Moderate winds: ${windSpeed.toFixed(1)} m/s`);
    }

    return {
      type: 'WIND',
      alertLevel,
      value: windSpeed,
      unit: 'm/s',
      reasons
    };
  }

  /**
   * Generate actionable recommendations based on risks
   */
  generateRecommendations(risks, barangay) {
    const recommendations = [];
    const maxPriority = Math.max(
      risks.flood.alertLevel.priority,
      risks.landslide.alertLevel.priority,
      risks.wind.alertLevel.priority
    );

    // RED Alert recommendations
    if (maxPriority === 3) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Initiate mandatory evacuation procedures',
        target: 'All vulnerable residents'
      });

      if (risks.flood.alertLevel.priority === 3) {
        recommendations.push({
          priority: 'IMMEDIATE',
          action: 'Close roads in flood-prone areas',
          target: 'Local authorities'
        });
        recommendations.push({
          priority: 'IMMEDIATE',
          action: 'Position rescue boats and equipment',
          target: 'Emergency responders'
        });
      }

      if (risks.landslide.alertLevel.priority === 3) {
        recommendations.push({
          priority: 'IMMEDIATE',
          action: 'Evacuate residents near slopes and cliffs',
          target: 'High-risk zones'
        });
        recommendations.push({
          priority: 'IMMEDIATE',
          action: 'Block access to landslide-prone roads',
          target: 'Transportation authority'
        });
      }

      if (risks.wind.alertLevel.priority === 3) {
        recommendations.push({
          priority: 'IMMEDIATE',
          action: 'Secure loose objects and outdoor equipment',
          target: 'All residents'
        });
      }

      recommendations.push({
        priority: 'IMMEDIATE',
        action: `Activate evacuation centers (${barangay.evacuationCenters.length} available)`,
        target: 'Barangay officials'
      });
    }

    // ORANGE Alert recommendations
    if (maxPriority === 2) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Prepare evacuation centers and supplies',
        target: 'Barangay officials'
      });
      recommendations.push({
        priority: 'HIGH',
        action: 'Alert vulnerable populations to prepare',
        target: 'Elderly, disabled, children'
      });
      recommendations.push({
        priority: 'HIGH',
        action: 'Position emergency response teams',
        target: 'MDRRMO'
      });
      recommendations.push({
        priority: 'HIGH',
        action: 'Monitor conditions closely - situation may escalate',
        target: 'All officials'
      });
    }

    // YELLOW Alert recommendations
    if (maxPriority === 1) {
      recommendations.push({
        priority: 'ADVISORY',
        action: 'Monitor weather updates regularly',
        target: 'All residents'
      });
      recommendations.push({
        priority: 'ADVISORY',
        action: 'Review evacuation plans and routes',
        target: 'Families'
      });
      recommendations.push({
        priority: 'ADVISORY',
        action: 'Prepare emergency kits and supplies',
        target: 'All households'
      });
      recommendations.push({
        priority: 'ADVISORY',
        action: 'Conduct situation assessment',
        target: 'Barangay officials'
      });
    }

    return recommendations;
  }

  /**
   * Escalate alert level by one priority
   */
  escalateAlert(currentAlert) {
    const nextPriority = Math.min(currentAlert.priority + 1, 3);
    return Object.values(this.alertLevels).find(
      level => level.priority === nextPriority
    );
  }

  /**
   * Get maximum value from array
   */
  getMaxValue(array) {
    if (!array || !Array.isArray(array) || array.length === 0) return 0;
    return Math.max(...array.filter(v => typeof v === 'number' && !isNaN(v)));
  }

  /**
   * Get maximum soil moisture from weather data
   */
  getMaxSoilMoisture(weather) {
    const soilKeys = [
      'soil_moisture_0_to_1cm',
      'soil_moisture_1_to_3cm',
      'soil_moisture_3_to_9cm'
    ];

    let maxSoil = 0;
    for (const key of soilKeys) {
      if (weather[key] && Array.isArray(weather[key])) {
        const localMax = this.getMaxValue(weather[key]);
        if (localMax > maxSoil) maxSoil = localMax;
      }
    }

    return maxSoil;
  }

  /**
   * Get alert statistics summary
   */
  getAlertStatistics(alerts) {
    const stats = {
      total: alerts.length,
      byLevel: {
        RED: alerts.filter(a => a.alertLevel.level === 'RED').length,
        ORANGE: alerts.filter(a => a.alertLevel.level === 'ORANGE').length,
        YELLOW: alerts.filter(a => a.alertLevel.level === 'YELLOW').length,
        GREEN: alerts.filter(a => a.alertLevel.level === 'GREEN').length
      },
      byRiskType: {
        flood: alerts.filter(a => a.risks.flood.alertLevel.priority > 0).length,
        landslide: alerts.filter(a => a.risks.landslide.alertLevel.priority > 0).length,
        wind: alerts.filter(a => a.risks.wind.alertLevel.priority > 0).length
      },
      criticalBarangays: alerts.filter(a => a.alertLevel.level === 'RED').map(a => a.barangayName)
    };

    return stats;
  }
}

module.exports = new DSSAlertService();
