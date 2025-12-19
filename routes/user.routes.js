const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');
const { body, query } = require('express-validator');

const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

// Get all users (Admin only - with pagination and filters)
router.get(
  '/',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
  ],
  userController.index
);

// Get single user
router.get('/:id', userController.show);

// Create new user (Admin only)
router.post(
  '/',
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('roleId').isInt({ min: 1 }).withMessage('Valid role ID is required'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
  ],
  userController.store
);

// Update user
router.put(
  '/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('firstName').optional().notEmpty(),
    body('lastName').optional().notEmpty(),
    body('roleId').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
  ],
  userController.update
);

// Delete user (Admin only)
router.delete('/:id', requireAdmin, userController.destroy);

// Approve user (Admin only)
router.post('/:id/approve', requireAdmin, userController.approve);

// Reject user (Admin only)
router.post('/:id/reject', requireAdmin, userController.reject);

module.exports = router;

