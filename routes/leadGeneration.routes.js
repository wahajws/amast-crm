const express = require('express');
const router = express.Router();
const LeadGenerationController = require('../controllers/LeadGenerationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Analyze company website
router.post('/analyze', LeadGenerationController.analyzeCompany);

// Get all profiles for user
router.get('/profiles', LeadGenerationController.getProfiles);

// Get single profile
router.get('/profiles/:id', LeadGenerationController.getProfile);

// Update profile
router.put('/profiles/:id', LeadGenerationController.updateProfile);

// Generate leads
router.post('/generate', LeadGenerationController.generateLeads);

// Import leads
router.post('/import', LeadGenerationController.importLeads);

module.exports = router;

