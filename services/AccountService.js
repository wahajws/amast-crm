const BaseService = require('../base/BaseService');
const AccountRepository = require('../repositories/AccountRepository');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');
const { ROLES } = require('../config/constants');

class AccountService extends BaseService {
  constructor() {
    super(new AccountRepository());
  }

  async findAll(options = {}, currentUser = null) {
    try {
      // Apply role-based filtering
      if (currentUser) {
        // Get user role - handle both object and string formats
        let userRole;
        if (currentUser.role) {
          userRole = typeof currentUser.role === 'string' ? currentUser.role : (currentUser.role.name || currentUser.role);
        } else {
          userRole = null;
        }
        
        // VIEWER and USER roles can only see their own accounts
        if (userRole === 'VIEWER' || userRole === 'USER') {
          if (!options.where) {
            options.where = 'a.owner_id = ?';
            options.params = [currentUser.userId];
          } else {
            options.where = `(${options.where}) AND a.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId];
          }
        }
        // MANAGER can see team accounts (for now, same as owner_id - can be enhanced later)
        else if (userRole === 'MANAGER') {
          if (!options.where) {
            options.where = 'a.owner_id = ?';
            options.params = [currentUser.userId];
          } else {
            options.where = `(${options.where}) AND a.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId];
          }
        }
        // SUPER_ADMIN and ADMIN can see all accounts (no filtering needed)
      }

      return await this.repository.findAll(options);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findAll:`, error);
      throw error;
    }
  }

  async create(data, user = null) {
    try {
      // Map camelCase to snake_case for database
      const mappedData = mapToSnakeCase(data);
      
      // Set owner_id to current user if not provided
      if (user && !mappedData.owner_id && !mappedData.ownerId) {
        mappedData.owner_id = user.userId;
      }

      return await super.create(mappedData, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.create:`, error);
      throw error;
    }
  }

  async update(id, data, user = null) {
    try {
      // Check ownership/permissions before update
      if (user) {
        const existing = await this.repository.findById(id);
        if (!existing) {
          throw new Error('Account not found');
        }

        // Get user role - handle both object and string formats
        let userRole;
        if (user.role) {
          userRole = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
        } else {
          userRole = null;
        }
        
        // VIEWER cannot update
        if (userRole === 'VIEWER') {
          throw new Error('Viewers cannot update accounts');
        }

        // USER and MANAGER can only update their own accounts
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.ownerId !== user.userId) {
          throw new Error('You can only update your own accounts');
        }
      }

      // Map camelCase to snake_case for database
      const mappedData = mapToSnakeCase(data);

      return await super.update(id, mappedData, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.update:`, error);
      throw error;
    }
  }

  async delete(id, user = null) {
    try {
      // Check ownership/permissions before delete
      if (user) {
        const existing = await this.repository.findById(id);
        if (!existing) {
          throw new Error('Account not found');
        }

        const userRole = user.role;
        
        // VIEWER cannot delete
        if (userRole === 'VIEWER') {
          throw new Error('Viewers cannot delete accounts');
        }

        // USER and MANAGER can only delete their own accounts
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.ownerId !== user.userId) {
          throw new Error('You can only delete your own accounts');
        }
      }

      return await super.delete(id, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.delete:`, error);
      throw error;
    }
  }
}

module.exports = AccountService;

