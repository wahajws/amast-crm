const express = require('express');
const router = express.Router();
const ProposalController = require('../controllers/ProposalController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const proposalController = new ProposalController();

// All routes require authentication
router.use(authenticate);

// Get all proposals
router.get('/', proposalController.index);

// Get single proposal
router.get('/:id', proposalController.show);

// Create proposal
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Proposal title is required'),
    body('status').optional().isIn(['DRAFT', 'SENT', 'REVIEWED', 'APPROVED', 'REJECTED', 'ACCEPTED']).withMessage('Invalid status')
  ],
  proposalController.store
);

// Update proposal
router.put(
  '/:id',
  [
    body('status').optional().isIn(['DRAFT', 'SENT', 'REVIEWED', 'APPROVED', 'REJECTED', 'ACCEPTED']).withMessage('Invalid status')
  ],
  proposalController.update
);

// Delete proposal
router.delete('/:id', proposalController.destroy);

module.exports = router;







