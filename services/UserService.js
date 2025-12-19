const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const BaseService = require('../base/BaseService');
const UserRepository = require('../repositories/UserRepository');
const RoleRepository = require('../repositories/RoleRepository');
const EmailService = require('./EmailService');
const PasswordValidator = require('../utils/passwordValidator');
const { logger } = require('../utils/logger');

class UserService extends BaseService {
  constructor() {
    super(new UserRepository());
    this.roleRepository = new RoleRepository();
  }

  async create(data, user = null) {
    try {
      // Check if email already exists
      const existing = await this.repository.findByEmail(data.email);
      if (existing) {
        throw new Error('Email already exists');
      }

      // Validate password if provided
      if (data.password) {
        const passwordValidation = PasswordValidator.validate(data.password);
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.errors.join(', '));
        }

        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        data.password_hash = await bcrypt.hash(data.password, saltRounds);
        delete data.password;
      }

      // Set created_by
      if (user) {
        data.created_by = user.id;
      }

      return await super.create(data, user);
    } catch (error) {
      logger.error('UserService.create error:', error);
      throw error;
    }
  }

  /**
   * Register new user (requires admin approval)
   */
  async register(data) {
    try {
      // Check if email already exists
      const existing = await this.repository.findByEmail(data.email);
      if (existing) {
        throw new Error('Email already exists');
      }

      // Validate password
      if (!data.password) {
        throw new Error('Password is required');
      }

      const passwordValidation = PasswordValidator.validate(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // Get default USER role
      const sql = `SELECT * FROM roles WHERE name = ? LIMIT 1`;
      const roleResults = await this.roleRepository.query(sql, ['USER']);
      const userRole = roleResults.length > 0 ? this.roleRepository.model.fromDatabaseRow(roleResults[0]) : null;
      
      if (!userRole) {
        throw new Error('Default USER role not found');
      }

      // Generate registration token for email verification (optional)
      const registrationToken = crypto.randomBytes(32).toString('hex');
      const registrationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with PENDING status
      const userData = {
        email: data.email,
        password_hash: passwordHash,
        first_name: data.firstName || data.first_name || '',
        last_name: data.lastName || data.last_name || '',
        role_id: userRole.id,
        status: 'PENDING', // Requires admin approval
        registration_token: registrationToken,
        registration_token_expires_at: registrationTokenExpires
      };

      const newUser = await this.repository.create(userData);

      // Send welcome email
      try {
        const userName = `${userData.first_name} ${userData.last_name}`.trim() || userData.email;
        await EmailService.sendWelcomeEmail(newUser.email, userName);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      logger.info(`New user registered (pending approval): ${newUser.email}`);

      return {
        ...newUser.toJSON(),
        message: 'Registration successful. Your account is pending admin approval.'
      };
    } catch (error) {
      logger.error('UserService.register error:', error);
      throw error;
    }
  }

  /**
   * Approve user (admin only)
   */
  async approveUser(userId, approvedBy) {
    try {
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'ACTIVE' && user.approvedAt) {
        throw new Error('User is already approved');
      }

      // Update user status
      await this.repository.update(userId, {
        status: 'ACTIVE',
        approved_at: new Date(),
        approved_by: approvedBy
      });

      // Send approval email
      try {
        const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
        await EmailService.sendAccountApprovedEmail(user.email, userName);
      } catch (emailError) {
        logger.error('Failed to send approval email:', emailError);
      }

      logger.info(`User approved: ${user.email} by user ID: ${approvedBy}`);

      return await this.repository.findById(userId);
    } catch (error) {
      logger.error('UserService.approveUser error:', error);
      throw error;
    }
  }

  /**
   * Reject user registration (admin only)
   */
  async rejectUser(userId, rejectedBy, reason = null) {
    try {
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'PENDING') {
        throw new Error('User is not pending approval');
      }

      // Update user status
      await this.repository.update(userId, {
        status: 'INACTIVE'
      });

      // Send rejection email
      try {
        const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
        await EmailService.sendAccountRejectedEmail(user.email, userName, reason);
      } catch (emailError) {
        logger.error('Failed to send rejection email:', emailError);
      }

      logger.info(`User registration rejected: ${user.email} by user ID: ${rejectedBy}`);

      return true;
    } catch (error) {
      logger.error('UserService.rejectUser error:', error);
      throw error;
    }
  }

  async update(id, data, user = null) {
    try {
      // Hash password if provided
      if (data.password) {
        // Validate password strength
        const passwordValidation = PasswordValidator.validate(data.password);
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.errors.join(', '));
        }

        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        data.password_hash = await bcrypt.hash(data.password, saltRounds);
        delete data.password;
      }

      // Set updated_by
      if (user) {
        data.updated_by = user.id;
      }

      return await super.update(id, data, user);
    } catch (error) {
      logger.error('UserService.update error:', error);
      throw error;
    }
  }

  static async initializeDefaultAdmin() {
    try {
      const UserRepo = new UserRepository();
      const RoleRepo = new RoleRepository();

      // Check if admin already exists
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@crm.local';
      const existing = await UserRepo.findByEmail(adminEmail);
      
      if (existing) {
        logger.info('Default admin already exists');
        return;
      }

      // Find SUPER_ADMIN role (roles table doesn't have deleted_at)
      const sql = `SELECT * FROM roles WHERE name = ? LIMIT 1`;
      const roleResults = await RoleRepo.query(sql, ['SUPER_ADMIN']);
      const superAdminRole = roleResults.length > 0 ? RoleRepo.model.fromDatabaseRow(roleResults[0]) : null;
      if (!superAdminRole) {
        logger.warn('SUPER_ADMIN role not found. Please run migrations and seeds first.');
        return;
      }

      // Create default admin
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const passwordHash = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!',
        saltRounds
      );

      await UserRepo.create({
        email: adminEmail,
        password_hash: passwordHash,
        first_name: process.env.DEFAULT_ADMIN_FIRST_NAME || 'Admin',
        last_name: process.env.DEFAULT_ADMIN_LAST_NAME || 'User',
        role_id: superAdminRole.id,
        status: 'ACTIVE'
      });

      logger.info(`Default admin created: ${adminEmail}`);
    } catch (error) {
      logger.error('Error initializing default admin:', error);
      throw error;
    }
  }
}

module.exports = UserService;

