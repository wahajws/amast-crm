const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/EmailController');
const { authenticate } = require('../middleware/auth');
const { body, query } = require('express-validator');

const emailController = new EmailController();

// All routes require authentication
router.use(authenticate);

// Get all emails
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('contactId').optional().isInt({ min: 1 }),
    query('accountId').optional().isInt({ min: 1 }),
    query('unlinked').optional().isBoolean(),
    query('search').optional().isString()
  ],
  emailController.index
);

// Get single email
router.get('/:id', emailController.show);

// Get email thread
router.get('/thread/:threadId', emailController.getThread);

// Update email
router.put(
  '/:id',
  [
    body('isRead').optional().isBoolean(),
    body('isStarred').optional().isBoolean()
  ],
  emailController.update
);

// Link email to contact/account
router.post(
  '/:id/link',
  [
    body('contactId').optional().isInt({ min: 1 }),
    body('accountId').optional().isInt({ min: 1 })
  ],
  emailController.linkEmail
);

// Get unlinked emails
router.get('/unlinked/list', emailController.getUnlinked);

// Delete email
router.delete('/:id', emailController.destroy);

// Get emails by account with smart domain matching
router.get('/by-account/:accountId', emailController.getByAccount);

// Get email timeline for account
router.get('/timeline/:accountId', emailController.getTimeline);

// Send reply to email
router.post(
  '/:id/reply',
  [
    body('body').notEmpty().withMessage('Reply body is required'),
    body('subject').optional().isString(),
    body('signature').optional().isString(),
    body('initials').optional().isString()
  ],
  emailController.sendReply
);

module.exports = router;



