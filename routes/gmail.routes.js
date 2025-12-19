const express = require('express');
const router = express.Router();
const GmailController = require('../controllers/GmailController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const gmailController = new GmailController();

// All routes require authentication
router.use(authenticate);

// Get user's Gmail labels
router.get('/labels', gmailController.getLabels);

// Sync/refresh labels from Gmail
router.post('/labels/sync', gmailController.syncLabels);

// Update sync settings (which labels to sync)
router.put(
  '/labels/sync-settings',
  [
    body('labelIds').isArray().withMessage('labelIds must be an array'),
    body('labelIds.*').isString().withMessage('Each labelId must be a string'),
    body('isSyncing').isBoolean().withMessage('isSyncing must be a boolean')
  ],
  gmailController.updateSyncSettings
);

// Get labels that are currently being synced
router.get('/labels/syncing', gmailController.getSyncingLabels);

// Sync emails
router.post(
  '/sync',
  [
    body('labelId').optional().isString().withMessage('labelId must be a string')
  ],
  gmailController.syncEmails
);

// Get sync status
router.get('/sync/status', gmailController.getSyncStatus);

module.exports = router;







