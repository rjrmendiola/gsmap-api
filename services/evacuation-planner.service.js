const { Barangay, EvacuationCenter, BarangayProfile, HazardRiskAssessment } = require('../models');

/**
 * Evacuation Planner Service
 * Helps plan evacuations based on risk assessments and evacuation center capacity
 */
class EvacuationPlannerService {
  constructor() {
    // Standard capacity estimates per evacuation center type
    this.capacityEstimates = {
      school: 200,      // Typical school capacity
      chapel: 100,      // Church/chapel capacity
      gymnasium: 300,   // Sports facility capacity
      barangay_hall: 80, // Barangay hall capacity
      default: 150      // Default estimate
    };

    // Evacuation priorities
    this.vulnerableGroups = [
      'Elderly (60+ years)',
      'Persons with disabilities',
      'Pregnant women',
      'Children under 5',
      'Sick or bedridden individuals',
      'Single-parent families with young children'
    ];
  }

  /**
   * Create comprehensive evacuation plan for all at-risk barangays
   */
  async createEvacuationPlan(alerts) {
    try {
      // Create plans for all barangays (for monitoring purposes)
      // Priority is given to ORANGE and RED, but we show all
      const plans = [];

      for (const alert of alerts) {
        const barangay = await Barangay.findByPk(alert.barangayId, {
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

        if (!barangay) continue;

        const plan = await this.createBarangayEvacuationPlan(barangay, alert);
        plans.push(plan);
      }

      // Sort by priority (highest risk first)
      plans.sort((a, b) => b.priority - a.priority);

      // Calculate resource requirements
      const resourceSummary = this.calculateResourceRequirements(plans);

      // Determine status
      const evacuationNeeded = plans.filter(p => p.priority >= 2);
      const status = evacuationNeeded.length > 0 ? 'EVACUATION_REQUIRED' : 'MONITORING';

      return {
        status,
        totalBarangays: plans.length,
        evacuationRequired: evacuationNeeded.length,
        totalEstimatedEvacuees: plans.reduce((sum, p) => sum + p.estimatedEvacuees, 0),
        plans,
        resourceSummary,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating evacuation plan:', error);
      throw error;
    }
  }

  /**
   * Create evacuation plan for a single barangay
   */
  async createBarangayEvacuationPlan(barangay, alert) {
    const profile = barangay.barangayProfile;
    
    const population = profile ? parseInt(profile.population_density) || 1000 : 1000;

    // Estimate evacuees based on risk level and affected area
    const evacuationRate = this.getEvacuationRate(alert.alertLevel.level);
    const estimatedEvacuees = Math.ceil(population * evacuationRate);

    // Calculate center assignments
    const centerAssignments = this.assignEvacuationCenters(
      barangay.evacuationCenters,
      estimatedEvacuees
    );

    // Determine evacuation timeline
    const timeline = this.calculateEvacuationTimeline(alert.alertLevel.level, estimatedEvacuees);

    // Get priority groups for evacuation order
    const evacuationOrder = this.determineEvacuationOrder(alert);

    return {
      barangayId: barangay.id,
      barangayName: barangay.name,
      priority: alert.alertLevel.priority,
      alertLevel: alert.alertLevel.level,
      population: population,
      estimatedEvacuees: estimatedEvacuees,
      evacuationRate: (evacuationRate * 100).toFixed(0) + '%',
      evacuationCenters: centerAssignments,
      totalCapacity: centerAssignments.reduce((sum, c) => sum + c.capacity, 0),
      capacityStatus: this.getCapacityStatus(estimatedEvacuees, centerAssignments),
      timeline: timeline,
      evacuationOrder: evacuationOrder,
      risks: {
        flood: alert.risks.flood.alertLevel.level,
        landslide: alert.risks.landslide.alertLevel.level,
        wind: alert.risks.wind.alertLevel.level
      },
      routes: this.suggestEvacuationRoutes(barangay, alert),
      contactPerson: centerAssignments[0]?.contactPerson || 'Barangay Captain',
      specialNeeds: this.identifySpecialNeeds(estimatedEvacuees)
    };
  }

  /**
   * Get evacuation rate based on alert level
   */
  getEvacuationRate(alertLevel) {
    const rates = {
      'RED': 0.60,     // 60% of population needs evacuation
      'ORANGE': 0.35,  // 35% of population needs evacuation
      'YELLOW': 0.15,  // 15% of vulnerable population
      'GREEN': 0
    };
    return rates[alertLevel] || 0;
  }

  /**
   * Assign evacuees to available evacuation centers
   */
  assignEvacuationCenters(centers, totalEvacuees) {
    const assignments = [];
    let remainingEvacuees = totalEvacuees;

    for (const center of centers) {
      if (remainingEvacuees <= 0) break;

      // Estimate capacity based on venue name/type
      const capacity = this.estimateCapacity(center.venue || center.name);
      const assigned = Math.min(capacity, remainingEvacuees);

      assignments.push({
        id: center.id,
        name: center.name,
        venue: center.venue,
        latitude: center.latitude,
        longitude: center.longitude,
        capacity: capacity,
        assignedEvacuees: assigned,
        utilizationRate: ((assigned / capacity) * 100).toFixed(0) + '%',
        status: assigned >= capacity ? 'FULL' : 'AVAILABLE',
        contactPerson: center.official ?
          `${center.official.first_name} ${center.official.last_name}` :
          'Contact barangay office'
      });

      remainingEvacuees -= assigned;
    }

    // If still have remaining evacuees, flag it
    if (remainingEvacuees > 0) {
      assignments.push({
        id: null,
        name: 'Additional Centers Required',
        venue: 'Coordinate with neighboring barangays or municipal level',
        capacity: remainingEvacuees,
        assignedEvacuees: remainingEvacuees,
        status: 'OVERFLOW',
        contactPerson: 'Contact MDRRMO'
      });
    }

    return assignments;
  }

  /**
   * Estimate evacuation center capacity
   */
  estimateCapacity(venueName) {
    const name = venueName.toLowerCase();

    if (name.includes('school') || name.includes('elementary') || name.includes('high school')) {
      return this.capacityEstimates.school;
    }
    if (name.includes('chapel') || name.includes('church') || name.includes('catholic')) {
      return this.capacityEstimates.chapel;
    }
    if (name.includes('gym') || name.includes('covered court') || name.includes('sports')) {
      return this.capacityEstimates.gymnasium;
    }
    if (name.includes('barangay hall') || name.includes('hall')) {
      return this.capacityEstimates.barangay_hall;
    }

    return this.capacityEstimates.default;
  }

  /**
   * Calculate evacuation timeline
   */
  calculateEvacuationTimeline(alertLevel, evacuees) {
    const baseTimelines = {
      'RED': {
        warning: '0 hours (Immediate)',
        vulnerableGroups: 'Within 1 hour',
        generalPopulation: 'Within 2 hours',
        deadline: 'Complete within 3 hours'
      },
      'ORANGE': {
        warning: 'Within 1 hour',
        vulnerableGroups: 'Within 2 hours',
        generalPopulation: 'Within 4 hours',
        deadline: 'Complete within 6 hours'
      },
      'YELLOW': {
        warning: 'Within 2 hours',
        vulnerableGroups: 'Within 4 hours',
        generalPopulation: 'As needed',
        deadline: 'Stand-by for further instructions'
      }
    };

    return baseTimelines[alertLevel] || baseTimelines['YELLOW'];
  }

  /**
   * Determine evacuation order priority
   */
  determineEvacuationOrder(alert) {
    const order = [];

    // Priority 1: Areas with compound risks
    if (alert.risks.flood.alertLevel.priority >= 2 &&
        alert.risks.landslide.alertLevel.priority >= 2) {
      order.push({
        priority: 1,
        group: 'Areas with both flood and landslide risk',
        action: 'Immediate evacuation - highest priority'
      });
    }

    // Priority 2: Vulnerable populations
    order.push({
      priority: 2,
      group: 'Vulnerable groups',
      members: this.vulnerableGroups,
      action: 'Evacuate first - require assistance and transport'
    });

    // Priority 3: High-risk zones
    if (alert.risks.flood.alertLevel.priority === 3) {
      order.push({
        priority: 3,
        group: 'Residents in low-lying flood-prone areas',
        action: 'Evacuate before water levels rise'
      });
    }

    if (alert.risks.landslide.alertLevel.priority === 3) {
      order.push({
        priority: 3,
        group: 'Residents near slopes, cliffs, and unstable ground',
        action: 'Evacuate before soil collapse'
      });
    }

    // Priority 4: Light structures
    if (alert.risks.wind.alertLevel.priority >= 2) {
      order.push({
        priority: 4,
        group: 'Residents in light/makeshift structures',
        action: 'Move to sturdy evacuation centers'
      });
    }

    // Priority 5: General population
    order.push({
      priority: 5,
      group: 'General population in affected areas',
      action: 'Voluntary evacuation recommended'
    });

    return order;
  }

  /**
   * Suggest evacuation routes
   */
  suggestEvacuationRoutes(barangay, alert) {
    const routes = {
      primary: `Main barangay road to designated evacuation centers`,
      avoid: []
    };

    if (alert.risks.flood.alertLevel.priority >= 2) {
      routes.avoid.push('Low-lying roads and creek crossings');
      routes.avoid.push('Known flood-prone sections');
    }

    if (alert.risks.landslide.alertLevel.priority >= 2) {
      routes.avoid.push('Roads along steep slopes');
      routes.avoid.push('Recently reported cracks or unstable areas');
    }

    routes.recommendations = [
      'Use well-lit main roads',
      'Travel in groups if possible',
      'Follow instructions from barangay officials',
      'Bring emergency supplies and important documents'
    ];

    return routes;
  }

  /**
   * Get capacity status
   */
  getCapacityStatus(evacuees, centers) {
    const totalCapacity = centers.reduce((sum, c) => sum + (c.capacity || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (evacuees / totalCapacity) * 100 : 0;

    if (utilizationRate > 100) {
      return {
        status: 'INSUFFICIENT',
        message: 'Additional evacuation centers needed',
        utilizationRate: utilizationRate.toFixed(0) + '%'
      };
    } else if (utilizationRate > 80) {
      return {
        status: 'NEAR_CAPACITY',
        message: 'Centers will be near full capacity',
        utilizationRate: utilizationRate.toFixed(0) + '%'
      };
    } else {
      return {
        status: 'SUFFICIENT',
        message: 'Adequate capacity available',
        utilizationRate: utilizationRate.toFixed(0) + '%'
      };
    }
  }

  /**
   * Identify special needs for evacuation
   */
  identifySpecialNeeds(evacuees) {
    // Estimate based on typical demographics
    return {
      medical: Math.ceil(evacuees * 0.10), // 10% may need medical attention
      mobility: Math.ceil(evacuees * 0.05), // 5% may need mobility assistance
      infants: Math.ceil(evacuees * 0.03),  // 3% infants needing formula/diapers
      dietary: Math.ceil(evacuees * 0.08)   // 8% with special dietary needs
    };
  }

  /**
   * Calculate overall resource requirements
   */
  calculateResourceRequirements(plans) {
    const totalEvacuees = plans.reduce((sum, p) => sum + p.estimatedEvacuees, 0);

    return {
      personnel: {
        medicalStaff: Math.ceil(totalEvacuees / 100), // 1 medical staff per 100 evacuees
        securityPersonnel: Math.ceil(totalEvacuees / 150), // 1 security per 150
        socialWorkers: Math.ceil(totalEvacuees / 200), // 1 social worker per 200
        volunteers: Math.ceil(totalEvacuees / 50) // 1 volunteer per 50
      },
      supplies: {
        foodPacks: totalEvacuees * 3, // 3 meals per person initially
        waterBottles: totalEvacuees * 6, // 6 bottles per person (3 days)
        blankets: Math.ceil(totalEvacuees * 0.5), // 1 blanket per 2 people
        hygieneKits: Math.ceil(totalEvacuees / 5), // 1 kit per family (avg 5)
        firstAidKits: Math.ceil(plans.length * 2) // 2 kits per evacuation center
      },
      equipment: {
        generators: plans.length, // 1 per active evacuation center
        communicationRadios: plans.length * 2,
        flashlights: Math.ceil(totalEvacuees / 10),
        rescueBoats: Math.ceil(plans.filter(p => p.risks.flood === 'RED').length / 2)
      },
      vehicles: {
        evacuationVehicles: Math.ceil(totalEvacuees / 30), // 1 vehicle per 30 people
        ambulances: Math.ceil(plans.filter(p => p.priority === 3).length / 3)
      }
    };
  }

  /**
   * Get evacuation status summary
   */
  async getEvacuationStatus() {
    const centers = await EvacuationCenter.findAll({
      include: [
        { model: Barangay, as: 'barangay' },
        { model: require('../models').BarangayOfficial, as: 'official' }
      ]
    });

    return {
      totalCenters: centers.length,
      centersByBarangay: this.groupByBarangay(centers),
      estimatedTotalCapacity: centers.reduce(
        (sum, c) => sum + this.estimateCapacity(c.venue || c.name),
        0
      )
    };
  }

  /**
   * Group centers by barangay
   */
  groupByBarangay(centers) {
    const grouped = {};
    centers.forEach(center => {
      const barangayName = center.barangay ? center.barangay.name : 'Unknown';
      if (!grouped[barangayName]) {
        grouped[barangayName] = [];
      }
      grouped[barangayName].push({
        name: center.name,
        venue: center.venue,
        capacity: this.estimateCapacity(center.venue || center.name)
      });
    });
    return grouped;
  }
}

module.exports = new EvacuationPlannerService();
