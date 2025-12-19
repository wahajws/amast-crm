const BaseService = require('../base/BaseService');
const OpportunityRepository = require('../repositories/OpportunityRepository');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');

class OpportunityService extends BaseService {
  constructor() {
    super(new OpportunityRepository());
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
        
        // VIEWER and USER roles can only see their own opportunities
        if (userRole === 'VIEWER' || userRole === 'USER') {
          if (!options.where) {
            options.where = 'o.owner_id = ?';
            options.params = [currentUser.userId];
          } else {
            options.where = `(${options.where}) AND o.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId];
          }
        }
        // MANAGER can see team opportunities
        else if (userRole === 'MANAGER') {
          if (!options.where) {
            options.where = 'o.owner_id = ?';
            options.params = [currentUser.userId];
          } else {
            options.where = `(${options.where}) AND o.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId];
          }
        }
        // SUPER_ADMIN and ADMIN can see all opportunities
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
          throw new Error('Opportunity not found');
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
          throw new Error('Viewers cannot update opportunities');
        }

        // USER and MANAGER can only update their own opportunities
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.ownerId !== user.userId) {
          throw new Error('You can only update your own opportunities');
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
          throw new Error('Opportunity not found');
        }

        // Get user role - handle both object and string formats
        let userRole;
        if (user.role) {
          userRole = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
        } else {
          userRole = null;
        }
        
        // VIEWER cannot delete
        if (userRole === 'VIEWER') {
          throw new Error('Viewers cannot delete opportunities');
        }

        // USER and MANAGER can only delete their own opportunities
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.ownerId !== user.userId) {
          throw new Error('You can only delete your own opportunities');
        }
      }

      return await super.delete(id, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.delete:`, error);
      throw error;
    }
  }
}

module.exports = OpportunityService;

