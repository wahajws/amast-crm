const express = require('express');
const router = express.Router();
const NoteController = require('../controllers/NoteController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const noteController = new NoteController();

// All routes require authentication
router.use(authenticate);

// Get all notes
router.get('/', noteController.index);

// Get notes by contact
router.get('/contact/:contactId', noteController.getByContact);

// Get notes by account
router.get('/account/:accountId', noteController.getByAccount);

// Get single note
router.get('/:id', noteController.show);

// Create note
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Note title is required'),
    body('content').notEmpty().withMessage('Note content is required'),
    body('contactId').optional().isInt().withMessage('Invalid contact ID'),
    body('accountId').optional().isInt().withMessage('Invalid account ID')
  ],
  noteController.store
);

// Update note
router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Note title cannot be empty'),
    body('content').optional().notEmpty().withMessage('Note content cannot be empty'),
    body('reminderDate').optional().isISO8601().withMessage('Invalid reminder date format'),
    body('reminderStatus').optional().isIn(['PENDING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid reminder status')
  ],
  noteController.update
);

// Mark note reminder as complete
router.patch('/:id/reminder/complete', noteController.markReminderComplete);

// Delete note
router.delete('/:id', noteController.destroy);

module.exports = router;



