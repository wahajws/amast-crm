const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');
const contactRoutes = require('./contact.routes');
const emailRoutes = require('./email.routes');
const gmailRoutes = require('./gmail.routes');
const noteRoutes = require('./note.routes');
const opportunityRoutes = require('./opportunity.routes');
const profileRoutes = require('./profile.routes');
const proposalRoutes = require('./proposal.routes');
const reminderRoutes = require('./reminder.routes');
const roleRoutes = require('./role.routes');
const userRoutes = require('./user.routes');
const leadGenerationRoutes = require('./leadGeneration.routes');
const bulkImportRoutes = require('./bulkImport.routes');
const emailCampaignRoutes = require('./emailCampaign.routes');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/contacts', contactRoutes);
router.use('/emails', emailRoutes);
router.use('/gmail', gmailRoutes);
router.use('/notes', noteRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/profile', profileRoutes);
router.use('/proposals', proposalRoutes);
router.use('/reminders', reminderRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/lead-generation', leadGenerationRoutes);
router.use('/bulk-import', bulkImportRoutes);
router.use('/email-campaigns', emailCampaignRoutes);

module.exports = router;
