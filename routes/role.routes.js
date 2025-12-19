const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');
const { body } = require('express-validator');

const roleController = new RoleController();

// Get all roles - anyone authenticated can view roles
router.get('/', authenticate, roleController.index);

// Get single role - anyone authenticated can view
router.get('/:id', authenticate, roleController.show);

// Create role (Admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Role name is required')
      .matches(/^[A-Z_]+$/).withMessage('Role name must be uppercase with underscores'),
    body('displayName').notEmpty().withMessage('Display name is required'),
    body('description').optional()
  ],
  roleController.store
);

// Update role (Admin only)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('displayName').optional().notEmpty(),
    body('description').optional()
  ],
  roleController.update
);

// Delete role (Admin only)
router.delete('/:id', authenticate, requireAdmin, roleController.destroy);

module.exports = router;







