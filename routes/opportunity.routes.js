const express = require('express');
const router = express.Router();
const OpportunityController = require('../controllers/OpportunityController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const opportunityController = new OpportunityController();

// All routes require authentication
router.use(authenticate);

// Get all opportunities
router.get('/', opportunityController.index);

// Get single opportunity
router.get('/:id', opportunityController.show);

// Create opportunity
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Opportunity name is required'),
    body('stage').optional().isIn(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).withMessage('Invalid stage'),
    body('status').optional().isIn(['ACTIVE', 'WON', 'LOST', 'CANCELLED']).withMessage('Invalid status'),
    body('probability').optional().isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100')
  ],
  opportunityController.store
);

// Update opportunity
router.put(
  '/:id',
  [
    body('stage').optional().isIn(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).withMessage('Invalid stage'),
    body('status').optional().isIn(['ACTIVE', 'WON', 'LOST', 'CANCELLED']).withMessage('Invalid status'),
    body('probability').optional().isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100')
  ],
  opportunityController.update
);

// Delete opportunity
router.delete('/:id', opportunityController.destroy);

module.exports = router;







