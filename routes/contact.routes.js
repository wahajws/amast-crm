const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/ContactController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const contactController = new ContactController();

// All routes require authentication
router.use(authenticate);

// Get all contacts
router.get('/', contactController.index);

// Get emails for a contact (must come before /:id)
router.get('/:id/emails', contactController.getEmails);

// Get single contact
router.get('/:id', contactController.show);

// Create contact
router.post(
  '/',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'LEAD']).withMessage('Invalid status')
  ],
  contactController.store
);

// Update contact
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'LEAD']).withMessage('Invalid status')
  ],
  contactController.update
);

// Delete contact
router.delete('/:id', contactController.destroy);

module.exports = router;

