/**
 * Decision Rules Service
 * Implements if-then decision rules for disaster response
 */
class DecisionRulesService {
  constructor() {
    // Define decision rules matrix
    this.rules = [
      {
        id: 'DR-001',
        category: 'FLOOD',
        priority: 'CRITICAL',
        condition: {
          rainfall: { min: 150 },
          floodLevel: ['High']
        },
        action: 'Mandatory evacuation of all residents in flood zones',
        responsible: ['Barangay Captain', 'MDRRMO'],
        timeline: 'Immediate (within 2 hours)',
        resources: ['Evacuation vehicles', 'Rescue boats', 'Emergency personnel']
      },
      {
        id: 'DR-002',
        category: 'FLOOD',
        priority: 'HIGH',
        condition: {
          rainfall: { min: 100, max: 149 },
          floodLevel: ['High', 'Moderate']
        },
        action: 'Pre-emptive evacuation of vulnerable populations',
        responsible: ['Barangay Officials', 'Health Workers'],
        timeline: 'Within 4 hours',
        resources: ['Evacuation centers', 'Medical supplies', 'Food packs']
      },
      {
        id: 'DR-003',
        category: 'FLOOD',
        priority: 'MEDIUM',
        condition: {
          rainfall: { min: 50, max: 99 }
        },
        action: 'Activate flood monitoring team and prepare evacuation centers',
        responsible: ['Barangay Disaster Team'],
        timeline: 'Within 6 hours',
        resources: ['Communication equipment', 'Supplies inventory']
      },
      {
        id: 'DR-004',
        category: 'LANDSLIDE',
        priority: 'CRITICAL',
        condition: {
          soilMoisture: { min: 0.85 },
          slope: { min: 30 },
          landslideLevel: ['High']
        },
        action: 'Immediate evacuation of residents near slopes and road closures',
        responsible: ['Barangay Captain', 'PNP', 'DPWH'],
        timeline: 'Immediate (within 1 hour)',
        resources: ['Barriers', 'Warning signs', 'Evacuation vehicles']
      },
      {
        id: 'DR-005',
        category: 'LANDSLIDE',
        priority: 'HIGH',
        condition: {
          soilMoisture: { min: 0.75 },
          slope: { min: 30 }
        },
        action: 'Landslide watch - inspect vulnerable areas and restrict access',
        responsible: ['Engineering Office', 'Barangay Officials'],
        timeline: 'Within 3 hours',
        resources: ['Inspection team', 'Safety equipment', 'Signage']
      },
      {
        id: 'DR-006',
        category: 'LANDSLIDE',
        priority: 'MEDIUM',
        condition: {
          soilMoisture: { min: 0.60 },
          slope: { min: 25 }
        },
        action: 'Monitor soil conditions and issue advisory to hillside residents',
        responsible: ['Barangay Officials'],
        timeline: 'Within 6 hours',
        resources: ['Monitoring equipment', 'Communication tools']
      },
      {
        id: 'DR-007',
        category: 'WIND',
        priority: 'CRITICAL',
        condition: {
          windSpeed: { min: 35 }
        },
        action: 'Evacuate light structures and suspend all outdoor activities',
        responsible: ['Barangay Captain', 'MDRRMO'],
        timeline: 'Immediate',
        resources: ['Evacuation centers', 'Emergency personnel']
      },
      {
        id: 'DR-008',
        category: 'WIND',
        priority: 'HIGH',
        condition: {
          windSpeed: { min: 25, max: 34 }
        },
        action: 'Secure loose objects and issue strong wind warning',
        responsible: ['Barangay Officials', 'Residents'],
        timeline: 'Within 2 hours',
        resources: ['Public address system', 'SMS alerts']
      },
      {
        id: 'DR-009',
        category: 'COMPOUND',
        priority: 'CRITICAL',
        condition: {
          rainfall: { min: 100 },
          windSpeed: { min: 25 },
          floodLevel: ['High']
        },
        action: 'Activate full emergency response - multiple hazard scenario',
        responsible: ['Municipal Disaster Risk Reduction Office', 'All Barangay Officials'],
        timeline: 'Immediate',
        resources: ['All available emergency resources', 'Coordinate with provincial DRRM']
      },
      {
        id: 'DR-010',
        category: 'EVACUATION',
        priority: 'HIGH',
        condition: {
          alertLevel: ['RED', 'ORANGE']
        },
        action: 'Activate evacuation centers and prepare relief supplies',
        responsible: ['MSWDO', 'Barangay Officials', 'DSWD'],
        timeline: 'Within 2 hours',
        resources: ['Food packs', 'Water', 'Hygiene kits', 'Bedding', 'Medical supplies']
      },
      {
        id: 'DR-011',
        category: 'EVACUATION',
        priority: 'MEDIUM',
        condition: {
          evacuees: { min: 100 }
        },
        action: 'Request additional supplies and support from municipal level',
        responsible: ['Barangay Captain', 'MSWDO'],
        timeline: 'Within 4 hours',
        resources: ['Additional relief goods', 'Medical team', 'Security personnel']
      },
      {
        id: 'DR-012',
        category: 'COMMUNICATION',
        priority: 'HIGH',
        condition: {
          alertLevel: ['RED', 'ORANGE', 'YELLOW']
        },
        action: 'Disseminate alerts through all available channels',
        responsible: ['Public Information Office', 'Barangay Officials'],
        timeline: 'Immediate',
        resources: ['SMS system', 'Social media', 'Radio', 'Barangay PA system']
      },
      {
        id: 'DR-013',
        category: 'MEDICAL',
        priority: 'HIGH',
        condition: {
          evacuees: { min: 50 }
        },
        action: 'Deploy medical team to evacuation centers',
        responsible: ['Rural Health Unit', 'Barangay Health Workers'],
        timeline: 'Within 3 hours',
        resources: ['Medical supplies', 'Health personnel', 'First aid kits']
      },
      {
        id: 'DR-014',
        category: 'INFRASTRUCTURE',
        priority: 'HIGH',
        condition: {
          rainfall: { min: 150 }
        },
        action: 'Inspect critical infrastructure (bridges, roads, drainage)',
        responsible: ['Engineering Office', 'DPWH'],
        timeline: 'After weather subsides',
        resources: ['Engineering team', 'Assessment tools', 'Safety equipment']
      },
      {
        id: 'DR-015',
        category: 'RECOVERY',
        priority: 'MEDIUM',
        condition: {
          alertLevel: ['GREEN'],
          postEvent: true
        },
        action: 'Conduct damage assessment and needs analysis',
        responsible: ['MDRRMO', 'Barangay Officials', 'MSWD'],
        timeline: 'Within 24 hours after event',
        resources: ['Assessment forms', 'Documentation equipment', 'Survey team']
      }
    ];
  }

  /**
   * Get all decision rules
   */
  getAllRules() {
    return this.rules;
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category) {
    return this.rules.filter(rule => rule.category === category);
  }

  /**
   * Get triggered rules based on current conditions
   */
  getTriggeredRules(conditions) {
    const triggered = [];

    for (const rule of this.rules) {
      if (this.isRuleTriggered(rule, conditions)) {
        triggered.push({
          ...rule,
          triggered: true,
          triggeredAt: new Date()
        });
      }
    }

    // Sort by priority
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    triggered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return triggered;
  }

  /**
   * Check if a rule is triggered by current conditions
   */
  isRuleTriggered(rule, conditions) {
    const { condition } = rule;

    // Check rainfall condition
    if (condition.rainfall) {
      const rainfall = conditions.rainfall || 0;
      if (condition.rainfall.min && rainfall < condition.rainfall.min) return false;
      if (condition.rainfall.max && rainfall > condition.rainfall.max) return false;
    }

    // Check soil moisture condition
    if (condition.soilMoisture) {
      const soilMoisture = conditions.soilMoisture || 0;
      if (condition.soilMoisture.min && soilMoisture < condition.soilMoisture.min) return false;
      if (condition.soilMoisture.max && soilMoisture > condition.soilMoisture.max) return false;
    }

    // Check wind speed condition
    if (condition.windSpeed) {
      const windSpeed = conditions.windSpeed || 0;
      if (condition.windSpeed.min && windSpeed < condition.windSpeed.min) return false;
      if (condition.windSpeed.max && windSpeed > condition.windSpeed.max) return false;
    }

    // Check slope condition
    if (condition.slope) {
      const slope = conditions.slope || 0;
      if (condition.slope.min && slope < condition.slope.min) return false;
      if (condition.slope.max && slope > condition.slope.max) return false;
    }

    // Check flood level condition
    if (condition.floodLevel) {
      const floodLevel = conditions.floodLevel;
      if (!floodLevel || !condition.floodLevel.includes(floodLevel)) return false;
    }

    // Check landslide level condition
    if (condition.landslideLevel) {
      const landslideLevel = conditions.landslideLevel;
      if (!landslideLevel || !condition.landslideLevel.includes(landslideLevel)) return false;
    }

    // Check alert level condition
    if (condition.alertLevel) {
      const alertLevel = conditions.alertLevel;
      if (!alertLevel || !condition.alertLevel.includes(alertLevel)) return false;
    }

    // Check evacuees condition
    if (condition.evacuees) {
      const evacuees = conditions.evacuees || 0;
      if (condition.evacuees.min && evacuees < condition.evacuees.min) return false;
      if (condition.evacuees.max && evacuees > condition.evacuees.max) return false;
    }

    // Check post-event condition
    if (condition.postEvent && !conditions.postEvent) return false;

    return true;
  }

  /**
   * Get decision matrix for display
   */
  getDecisionMatrix() {
    const matrix = {
      categories: ['FLOOD', 'LANDSLIDE', 'WIND', 'COMPOUND', 'EVACUATION', 'COMMUNICATION', 'MEDICAL', 'INFRASTRUCTURE', 'RECOVERY'],
      priorities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      rules: this.rules,
      summary: {
        total: this.rules.length,
        byCat: {},
        byPriority: {}
      }
    };

    // Calculate summaries
    matrix.categories.forEach(cat => {
      matrix.summary.byCat[cat] = this.rules.filter(r => r.category === cat).length;
    });

    matrix.priorities.forEach(pri => {
      matrix.summary.byPriority[pri] = this.rules.filter(r => r.priority === pri).length;
    });

    return matrix;
  }

  /**
   * Get recommended actions for a specific barangay
   */
  getRecommendedActions(barangayConditions) {
    const triggeredRules = this.getTriggeredRules(barangayConditions);

    return {
      barangay: barangayConditions.barangayName,
      timestamp: new Date(),
      conditions: barangayConditions,
      triggeredRules: triggeredRules,
      immediateActions: triggeredRules.filter(r => r.priority === 'CRITICAL'),
      priorityActions: triggeredRules.filter(r => r.priority === 'HIGH'),
      advisoryActions: triggeredRules.filter(r => r.priority === 'MEDIUM' || r.priority === 'LOW')
    };
  }
}

module.exports = new DecisionRulesService();
