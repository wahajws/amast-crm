const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const profileController = new ProfileController();

// All profile routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/', profileController.getProfile);

// Update current user profile
router.put(
  '/',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required')
  ],
  profileController.updateProfile
);

// Change password
router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  profileController.changePassword
);

// Get user's active sessions
router.get('/sessions', profileController.getSessions);

// Revoke specific session
router.delete('/sessions/:id', profileController.revokeSession);

module.exports = router;







