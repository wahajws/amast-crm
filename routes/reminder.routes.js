const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/ReminderController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const reminderController = new ReminderController();

// All routes require authentication
router.use(authenticate);

// Get all reminders
router.get('/', reminderController.index);

// Get upcoming reminders
router.get('/upcoming', reminderController.getUpcoming);

// Get single reminder
router.get('/:id', reminderController.show);

// Create reminder
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Reminder title is required'),
    body('dueDate').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Invalid date format'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('status').optional().isIn(['PENDING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
    body('contactId').optional().isInt().withMessage('Invalid contact ID'),
    body('accountId').optional().isInt().withMessage('Invalid account ID')
  ],
  reminderController.store
);

// Update reminder
router.put(
  '/:id',
  [
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('status').optional().isIn(['PENDING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status')
  ],
  reminderController.update
);

// Mark reminder as complete
router.patch('/:id/complete', reminderController.markComplete);

// Delete reminder
router.delete('/:id', reminderController.destroy);

module.exports = router;







