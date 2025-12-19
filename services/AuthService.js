const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const jwtConfig = require('../config/jwt');
const UserRepository = require('../repositories/UserRepository');
const SessionRepository = require('../repositories/SessionRepository');
const PasswordResetTokenRepository = require('../repositories/PasswordResetTokenRepository');
const EmailService = require('./EmailService');
const PasswordValidator = require('../utils/passwordValidator');
const { logger } = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
    this.passwordResetTokenRepository = new PasswordResetTokenRepository();
  }

  async login(email, password) {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check account lockout
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
        throw new Error(`Account is locked. Please try again in ${minutesLeft} minute(s).`);
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active. Please contact administrator.');
      }

      // Check if user is approved (for registered users)
      if (user.status === 'PENDING' && !user.approvedAt) {
        throw new Error('Your account is pending admin approval. Please wait for approval.');
      }

      // Verify password
      if (!user.passwordHash) {
        throw new Error('Password not set. Please use Gmail login or reset password.');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(user.id);
        throw new Error('Invalid email or password');
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLoginAttempts(user.id);

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Create session
      await this.sessionRepository.create({
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: null, // Can be passed from request
        userAgent: null // Can be passed from request
      });

      return {
        user: user.toJSON(),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Increment failed login attempts and lock account if needed
   */
  async incrementFailedLoginAttempts(userId) {
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION_MINUTES = 30;

    const user = await this.userRepository.findById(userId);
    if (!user) return;

    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    
    if (failedAttempts >= MAX_ATTEMPTS) {
      // Lock account
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await this.userRepository.update(userId, {
        failed_login_attempts: failedAttempts,
        locked_until: lockedUntil
      });
      logger.warn(`Account locked due to ${failedAttempts} failed login attempts: ${user.email}`);
    } else {
      // Just increment attempts
      await this.userRepository.update(userId, {
        failed_login_attempts: failedAttempts
      });
    }
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedLoginAttempts(userId) {
    await this.userRepository.update(userId, {
      failed_login_attempts: 0,
      locked_until: null
    });
  }

  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'USER'
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.refreshExpiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }
    );

    return { accessToken, refreshToken };
  }

  async verifyToken(token) {
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Token is required');
      }

      // Trim token to remove any whitespace
      const cleanToken = token.trim();

      const decoded = jwt.verify(cleanToken, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      });

      // Ensure decoded has userId
      if (!decoded.userId && !decoded.id) {
        throw new Error('Invalid token payload');
      }

      // Normalize userId (some tokens might use 'id' instead of 'userId')
      if (!decoded.userId && decoded.id) {
        decoded.userId = decoded.id;
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active yet');
      }
      throw new Error(error.message || 'Invalid or expired token');
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = await this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User not found or inactive');
      }

      const tokens = await this.generateTokens(user);
      
      // Update session
      await this.sessionRepository.updateRefreshToken(refreshToken, tokens.accessToken, tokens.refreshToken);

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  async logout(token) {
    try {
      await this.sessionRepository.deactivateByToken(token);
      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user.toJSON();
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return { success: true, message: 'If the email exists, a password reset link has been sent.' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this user
      await this.passwordResetTokenRepository.deleteByUserId(user.id);

      // Create new token
      await this.passwordResetTokenRepository.create(user.id, resetToken, expiresAt);

      // Send email
      try {
        await EmailService.sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails
      }

      return { success: true, message: 'If the email exists, a password reset link has been sent.' };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      // Validate password strength
      const passwordValidation = PasswordValidator.validate(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Find token
      const resetToken = await this.passwordResetTokenRepository.findByToken(token);
      if (!resetToken) {
        throw new Error('Invalid or expired reset token');
      }

      // Get user
      const user = await this.userRepository.findById(resetToken.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.userRepository.update(user.id, {
        password_hash: passwordHash,
        failed_login_attempts: 0,
        locked_until: null,
        must_change_password: false
      });

      // Mark token as used
      await this.passwordResetTokenRepository.markAsUsed(token);

      // Delete all other tokens for this user
      await this.passwordResetTokenRepository.deleteByUserId(user.id);

      logger.info(`Password reset successful for user: ${user.email}`);

      return { success: true, message: 'Password has been reset successfully' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(token) {
    try {
      const resetToken = await this.passwordResetTokenRepository.findByToken(token);
      if (!resetToken) {
        return { valid: false, message: 'Invalid or expired token' };
      }
      return { valid: true };
    } catch (error) {
      logger.error('Token verification error:', error);
      return { valid: false, message: 'Error verifying token' };
    }
  }
}

module.exports = AuthService;

