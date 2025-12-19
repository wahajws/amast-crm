const express = require('express');
const router = express.Router();
const EmailCampaignController = require('../controllers/EmailCampaignController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all email campaigns
router.get('/', EmailCampaignController.getAll);

// Get analytics
router.get('/analytics', EmailCampaignController.getAnalytics);

// Get urgent recommendations
router.get('/urgent', EmailCampaignController.getUrgentRecommendations);

// Get single email campaign
router.get('/:id', EmailCampaignController.getById);

// Create email campaign
router.post('/', EmailCampaignController.create);

// Update email campaign
router.put('/:id', EmailCampaignController.update);

// Auto-generate email for contact
router.post('/:id/generate-email', EmailCampaignController.generateEmail);

// Mark as sent
router.post('/:id/mark-sent', EmailCampaignController.markAsSent);

// Toggle communication started
router.post('/:id/toggle-communication', EmailCampaignController.toggleCommunicationStarted);

// Bulk mark as sent
router.post('/bulk/mark-sent', EmailCampaignController.bulkMarkAsSent);

// Delete email campaign
router.delete('/:id', EmailCampaignController.delete);

module.exports = router;

