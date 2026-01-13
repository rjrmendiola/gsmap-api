const express = require('express');
const router = express.Router();
const dssController = require('../controllers/dss.controller');

/**
 * DSS Routes
 * Decision Support System API endpoints
 */

// Alert System
router.get('/alerts/test/demo', dssController.getTestAlerts); // Test endpoint with sample data (must be before :barangayId)
router.get('/alerts', dssController.getAlerts);
router.get('/alerts/:barangayId', dssController.getBarangayAlert);

// Decision Rules
router.get('/decision-rules', dssController.getDecisionRules);
router.get('/decision-rules/triggered', dssController.getTriggeredRules);

// Evacuation Planning
router.get('/evacuation-plan', dssController.getEvacuationPlan);
router.get('/evacuation-plan/:barangayId', dssController.getBarangayEvacuationPlan);
router.get('/evacuation-status', dssController.getEvacuationStatus);

// Risk Scoring (MCDA)
router.get('/risk-scores', dssController.getRiskScores);
router.post('/risk-scores', dssController.getRiskScores); // POST to accept custom weights
router.post('/risk-scores/compare', dssController.compareScenarios); // Must be before :barangayId
router.get('/risk-scores/:barangayId', dssController.getBarangayRiskScore);
router.post('/risk-scores/:barangayId', dssController.getBarangayRiskScore);

// Dashboard
router.get('/dashboard', dssController.getDashboard);

module.exports = router;
