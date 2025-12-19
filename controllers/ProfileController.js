const BaseController = require('../base/BaseController');
const UserService = require('../services/UserService');
const SessionRepository = require('../repositories/SessionRepository');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

class ProfileController extends BaseController {
  constructor() {
    super(new UserService());
    this.userService = new UserService();
    this.sessionRepository = new SessionRepository();
  }

  // Get current user profile
  getProfile = this.asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return this.unauthorized(res, 'Not authenticated');
    }

    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        return this.notFound(res, 'User not found');
      }
      return this.success(res, user);
    } catch (error) {
      return this.error(res, error.message, 404);
    }
  });

  // Update current user profile
  updateProfile = this.asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return this.unauthorized(res, 'Not authenticated');
    }

    try {
      // Only allow updating firstName, lastName (not email, role, status)
      // Map camelCase to snake_case for database
      const updateData = {};
      if (req.body.firstName) updateData.first_name = req.body.firstName;
      if (req.body.lastName) updateData.last_name = req.body.lastName;

      // Remove any fields that shouldn't be updated
      delete updateData.email;
      delete updateData.roleId;
      delete updateData.role_id;
      delete updateData.status;
      delete updateData.password;
      delete updateData.password_hash;

      const result = await this.userService.update(userId, updateData, req.user);
      return this.success(res, result, 'Profile updated successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Change password
  changePassword = this.asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return this.unauthorized(res, 'Not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return this.error(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return this.error(res, 'New password must be at least 8 characters', 400);
    }

    try {
      // Get current user
      const user = await this.userService.findById(userId);
      if (!user) {
        return this.notFound(res, 'User not found');
      }

      // Verify current password
      if (!user.passwordHash) {
        return this.error(res, 'Password not set. Please use password reset.', 400);
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return this.error(res, 'Current password is incorrect', 401);
      }

      // Update password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await this.userService.update(userId, { password_hash: passwordHash }, req.user);
      return this.success(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password error:', error);
      return this.error(res, 'Failed to change password', 400);
    }
  });

  // Get user's active sessions
  getSessions = this.asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return this.unauthorized(res, 'Not authenticated');
    }

    try {
      const sql = `SELECT id, ip_address, user_agent, created_at, last_activity, expires_at, is_active
                   FROM user_sessions 
                   WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()
                   ORDER BY last_activity DESC`;
      const sessions = await this.sessionRepository.query(sql, [userId]);
      return this.success(res, sessions);
    } catch (error) {
      return this.error(res, 'Failed to fetch sessions', 400);
    }
  });

  // Revoke specific session
  revokeSession = this.asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return this.unauthorized(res, 'Not authenticated');
    }

    try {
      // Get session by ID and verify it belongs to user
      const sql = `SELECT * FROM user_sessions WHERE id = ? AND user_id = ? LIMIT 1`;
      const sessions = await this.sessionRepository.query(sql, [id, userId]);
      
      if (sessions.length === 0) {
        return this.notFound(res, 'Session not found or access denied');
      }

      // Deactivate session
      await this.sessionRepository.deactivateByToken(sessions[0].token);
      return this.success(res, null, 'Session revoked successfully');
    } catch (error) {
      return this.error(res, 'Failed to revoke session', 400);
    }
  });
}

module.exports = ProfileController;
