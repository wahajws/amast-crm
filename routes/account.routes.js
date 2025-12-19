const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/AccountController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const accountController = new AccountController();

// All routes require authentication
router.use(authenticate);

// Get all accounts
router.get('/', accountController.index);

// Get accounts with email counts
router.get('/with-email-counts', accountController.getAccountsWithEmailCounts);

// Get emails for an account (must come before /:id)
router.get('/:id/emails', accountController.getEmails);

// Get single account
router.get('/:id', accountController.show);

// Create account
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Account name is required'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'PROSPECT']).withMessage('Invalid status')
  ],
  accountController.store
);

// Update account
router.put(
  '/:id',
  [
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'PROSPECT']).withMessage('Invalid status')
  ],
  accountController.update
);

// Delete account
router.delete('/:id', accountController.destroy);

module.exports = router;

