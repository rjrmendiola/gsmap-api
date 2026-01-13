const { Barangay, HazardRiskAssessment, Slope, SoilMoisture, BarangayProfile } = require('../models');

/**
 * Risk Scoring Service (Multi-Criteria Decision Analysis - MCDA)
 * Calculates comprehensive risk scores based on multiple weighted criteria
 */
class RiskScoringService {
  constructor() {
    // Default weights for different criteria (must sum to 1.0)
    this.defaultWeights = {
      floodHazard: 0.25,        // 25% - Historical flood susceptibility
      landslideHazard: 0.25,    // 25% - Historical landslide susceptibility
      currentWeather: 0.20,     // 20% - Current weather conditions
      populationDensity: 0.15,  // 15% - Number of people at risk
      vulnerability: 0.10,      // 10% - Socioeconomic vulnerability
      infrastructure: 0.05      // 5% - Critical infrastructure presence
    };

    // Vulnerability factors
    this.vulnerabilityFactors = {
      agriculture: 1.2,  // Agricultural areas more vulnerable
      fishery: 1.1,      // Coastal/fishery areas
      trading: 0.9,      // Commercial areas less vulnerable
      mixed: 1.0         // Mixed livelihood
    };
  }

  /**
   * Calculate risk scores for all barangays
   */
  async calculateAllRiskScores(weatherData, customWeights = null) {
    try {
      const weights = customWeights || this.defaultWeights;

      const barangays = await Barangay.findAll({
        include: [
          { model: HazardRiskAssessment, as: 'hazardRisk' },
          { model: Slope, as: 'slope' },
          { model: SoilMoisture, as: 'soilMoisture' },
          { model: BarangayProfile, as: 'barangayProfile' }
        ]
      });

      const scores = [];

      for (const barangay of barangays) {
        const weather = weatherData[barangay.name] || weatherData[barangay.slug];
        const score = this.calculateBarangayRiskScore(barangay, weather, weights);
        scores.push(score);
      }

      // Sort by total risk score (descending)
      scores.sort((a, b) => b.totalScore - a.totalScore);

      return {
        scores,
        weights,
        summary: this.generateScoreSummary(scores),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error calculating risk scores:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive risk score for a single barangay
   */
  calculateBarangayRiskScore(barangay, weather, weights) {
    const criteria = {
      floodHazard: this.scoreFloodHazard(barangay.hazardRisk),
      landslideHazard: this.scoreLandslideHazard(barangay.hazardRisk, barangay.slope),
      currentWeather: this.scoreCurrentWeather(weather, barangay.soilMoisture),
      populationDensity: this.scorePopulationDensity(barangay.barangayProfile),
      vulnerability: this.scoreVulnerability(barangay.barangayProfile),
      infrastructure: this.scoreInfrastructure(barangay)
    };

    // Calculate weighted total score (0-100)
    const totalScore = Object.keys(criteria).reduce((sum, key) => {
      return sum + (criteria[key] * weights[key]);
    }, 0);

    // Determine risk category
    const riskCategory = this.determineRiskCategory(totalScore);

    return {
      barangayId: barangay.id,
      barangayName: barangay.name,
      totalScore: Math.round(totalScore * 100) / 100,
      riskCategory,
      criteria,
      weights,
      recommendations: this.generateRiskRecommendations(totalScore, criteria)
    };
  }

  /**
   * Score flood hazard (0-100)
   */
  scoreFloodHazard(hazardRisk) {
    if (!hazardRisk) return 25; // Default moderate risk

    const floodLevel = hazardRisk.flood_level;
    const floodRisk = hazardRisk.flood_risk;

    // Use numerical risk if available, otherwise map from level
    if (floodRisk) {
      return parseFloat(floodRisk);
    }

    const levelScores = {
      'High': 100,
      'Moderate': 50,
      'Low': 25
    };

    return levelScores[floodLevel] || 25;
  }

  /**
   * Score landslide hazard (0-100)
   */
  scoreLandslideHazard(hazardRisk, slope) {
    let score = 25; // Default

    // Base score from hazard assessment
    if (hazardRisk) {
      const landslideLevel = hazardRisk.landslide_level;
      const landslideRisk = hazardRisk.landslide_risk;

      if (landslideRisk) {
        score = parseFloat(landslideRisk);
      } else {
        const levelScores = {
          'High': 100,
          'Moderate': 50,
          'Low': 25
        };
        score = levelScores[landslideLevel] || 25;
      }
    }

    // Adjust based on slope angle
    if (slope && slope.mean) {
      const slopeMean = parseFloat(slope.mean);
      if (slopeMean >= 30) {
        score = Math.min(100, score * 1.3); // Increase by 30%
      } else if (slopeMean >= 20) {
        score = Math.min(100, score * 1.1); // Increase by 10%
      }
    }

    return score;
  }

  /**
   * Score current weather conditions (0-100)
   */
  scoreCurrentWeather(weather, soilMoisture) {
    if (!weather) return 0;

    let score = 0;

    // Rainfall component (0-40 points)
    const rainfall = this.getMaxValue(weather.rain);
    if (rainfall >= 150) {
      score += 40;
    } else if (rainfall >= 100) {
      score += 30;
    } else if (rainfall >= 50) {
      score += 20;
    } else if (rainfall >= 25) {
      score += 10;
    }

    // Soil moisture component (0-35 points)
    const soilMoistureValue = this.getMaxSoilMoisture(weather);
    if (soilMoistureValue >= 0.85) {
      score += 35;
    } else if (soilMoistureValue >= 0.75) {
      score += 25;
    } else if (soilMoistureValue >= 0.60) {
      score += 15;
    } else if (soilMoistureValue >= 0.40) {
      score += 5;
    }

    // Wind speed component (0-25 points)
    const windSpeed = this.getMaxValue(weather.wind_speed_10m);
    if (windSpeed >= 35) {
      score += 25;
    } else if (windSpeed >= 25) {
      score += 15;
    } else if (windSpeed >= 15) {
      score += 8;
    }

    return Math.min(100, score);
  }

  /**
   * Score population density (0-100)
   */
  scorePopulationDensity(profile) {
    if (!profile || !profile.population_density) return 50;

    const density = parseInt(profile.population_density);

    // Normalize population density (assuming max ~5000 for a barangay)
    if (density >= 3000) {
      return 100; // Very high density
    } else if (density >= 2000) {
      return 75;
    } else if (density >= 1000) {
      return 50;
    } else if (density >= 500) {
      return 30;
    } else {
      return 15;
    }
  }

  /**
   * Score vulnerability based on socioeconomic factors (0-100)
   */
  scoreVulnerability(profile) {
    if (!profile) return 50;

    let score = 50; // Base score

    // Analyze livelihood - agricultural communities more vulnerable
    const livelihood = profile.livelihood ? profile.livelihood.toLowerCase() : '';

    if (livelihood.includes('agriculture') || livelihood.includes('farming')) {
      score += 20;
    }
    if (livelihood.includes('fishery') || livelihood.includes('fishing')) {
      score += 15;
    }
    if (livelihood.includes('informal') || livelihood.includes('labor')) {
      score += 10;
    }

    // Area size - larger areas may have more resources
    const area = parseFloat(profile.area_sqkm) || 1;
    if (area < 1) {
      score += 10; // Small areas may be more vulnerable
    }

    return Math.min(100, score);
  }

  /**
   * Score infrastructure vulnerability (0-100)
   */
  scoreInfrastructure(barangay) {
    // This is a simplified scoring
    // In a real system, you'd have data on roads, bridges, critical facilities
    let score = 50; // Default moderate

    // Barangays with more evacuation centers have better infrastructure
    if (barangay.evacuationCenters) {
      const centerCount = barangay.evacuationCenters.length;
      if (centerCount >= 3) {
        score = 30; // Good infrastructure
      } else if (centerCount >= 2) {
        score = 40;
      } else if (centerCount >= 1) {
        score = 60;
      } else {
        score = 80; // No evacuation centers = vulnerable
      }
    }

    return score;
  }

  /**
   * Determine risk category from total score
   */
  determineRiskCategory(score) {
    if (score >= 75) {
      return { level: 'CRITICAL', color: '#DC2626', label: 'Critical Risk' };
    } else if (score >= 60) {
      return { level: 'HIGH', color: '#EA580C', label: 'High Risk' };
    } else if (score >= 40) {
      return { level: 'MODERATE', color: '#F59E0B', label: 'Moderate Risk' };
    } else if (score >= 25) {
      return { level: 'LOW', color: '#10B981', label: 'Low Risk' };
    } else {
      return { level: 'MINIMAL', color: '#059669', label: 'Minimal Risk' };
    }
  }

  /**
   * Generate recommendations based on risk score
   */
  generateRiskRecommendations(totalScore, criteria) {
    const recommendations = [];

    if (totalScore >= 75) {
      recommendations.push('IMMEDIATE ACTION REQUIRED: Initiate emergency response protocols');
      recommendations.push('Activate evacuation procedures for high-risk populations');
      recommendations.push('Deploy emergency response teams and resources');
    } else if (totalScore >= 60) {
      recommendations.push('HIGH PRIORITY: Prepare for potential evacuation');
      recommendations.push('Activate early warning systems and alert residents');
      recommendations.push('Position emergency resources at strategic locations');
    } else if (totalScore >= 40) {
      recommendations.push('Monitor situation closely for any escalation');
      recommendations.push('Ensure evacuation centers are ready for activation');
      recommendations.push('Conduct information campaigns for preparedness');
    } else {
      recommendations.push('Maintain routine monitoring of conditions');
      recommendations.push('Continue public education on disaster preparedness');
    }

    // Specific recommendations based on criteria
    if (criteria.floodHazard >= 75) {
      recommendations.push('FLOOD FOCUS: Clear drainage systems and waterways');
    }
    if (criteria.landslideHazard >= 75) {
      recommendations.push('LANDSLIDE FOCUS: Inspect slopes and restrict access to vulnerable areas');
    }
    if (criteria.currentWeather >= 75) {
      recommendations.push('WEATHER FOCUS: Severe conditions detected - immediate protective actions needed');
    }
    if (criteria.populationDensity >= 75) {
      recommendations.push('HIGH DENSITY: Plan for large-scale evacuation logistics');
    }

    return recommendations;
  }

  /**
   * Generate summary statistics
   */
  generateScoreSummary(scores) {
    const total = scores.length;
    const summary = {
      total,
      byCategory: {
        CRITICAL: scores.filter(s => s.riskCategory.level === 'CRITICAL').length,
        HIGH: scores.filter(s => s.riskCategory.level === 'HIGH').length,
        MODERATE: scores.filter(s => s.riskCategory.level === 'MODERATE').length,
        LOW: scores.filter(s => s.riskCategory.level === 'LOW').length,
        MINIMAL: scores.filter(s => s.riskCategory.level === 'MINIMAL').length
      },
      averageScore: scores.reduce((sum, s) => sum + s.totalScore, 0) / total,
      highestRisk: scores[0] ? {
        barangay: scores[0].barangayName,
        score: scores[0].totalScore
      } : null,
      lowestRisk: scores[scores.length - 1] ? {
        barangay: scores[scores.length - 1].barangayName,
        score: scores[scores.length - 1].totalScore
      } : null
    };

    return summary;
  }

  /**
   * Compare scenarios with different weights
   */
  async compareScenarios(weatherData, scenarios) {
    const results = [];

    for (const scenario of scenarios) {
      const { name, weights } = scenario;
      const scores = await this.calculateAllRiskScores(weatherData, weights);
      results.push({
        scenarioName: name,
        ...scores
      });
    }

    return results;
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
    if (!weather) return 0;

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
}

module.exports = new RiskScoringService();
