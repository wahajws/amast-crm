const BaseService = require('../base/BaseService');
const ContactRepository = require('../repositories/ContactRepository');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');
const { ROLES } = require('../config/constants');

class ContactService extends BaseService {
  constructor() {
    super(new ContactRepository());
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
        
        // VIEWER and USER roles can only see their own contacts
        if (userRole === 'VIEWER' || userRole === 'USER') {
          if (!options.where) {
            options.where = 'c.owner_id = ?';
            options.params = [currentUser.userId];
          } else {
            options.where = `(${options.where}) AND c.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId];
          }
        }
        // MANAGER can see team contacts (for now, same as owner_id - can be enhanced later)
        else if (userRole === 'MANAGER') {
          if (!options.where) {
            options.where = 'c.owner_id = ?';
            options.params = [currentUser.userId];
          } else {
            options.where = `(${options.where}) AND c.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId];
          }
        }
        // SUPER_ADMIN and ADMIN can see all contacts (no filtering needed)
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
      
      // Ensure required fields are never null
      if (!mappedData.first_name || mappedData.first_name.trim() === '') {
        mappedData.first_name = 'Contact';
      }
      if (!mappedData.last_name || mappedData.last_name.trim() === '') {
        mappedData.last_name = 'N/A';
      }
      
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
          throw new Error('Contact not found');
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
          throw new Error('Viewers cannot update contacts');
        }

        // USER and MANAGER can only update their own contacts
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.ownerId !== user.userId) {
          throw new Error('You can only update your own contacts');
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
          throw new Error('Contact not found');
        }

        const userRole = user.role;
        
        // VIEWER cannot delete
        if (userRole === 'VIEWER') {
          throw new Error('Viewers cannot delete contacts');
        }

        // USER and MANAGER can only delete their own contacts
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.ownerId !== user.userId) {
          throw new Error('You can only delete your own contacts');
        }
      }

      return await super.delete(id, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.delete:`, error);
      throw error;
    }
  }

  /**
   * Get email analytics based on contacts with email templates
   */
  async getEmailAnalytics(userId = null) {
    try {
      return await this.repository.getEmailAnalytics(userId);
    } catch (error) {
      logger.error(`Error getting email analytics:`, error);
      throw error;
    }
  }

  /**
   * Get urgent email recommendations
   */
  async getUrgentEmailRecommendations(userId = null, limit = 10) {
    try {
      return await this.repository.getUrgentEmailRecommendations(userId, limit);
    } catch (error) {
      logger.error(`Error getting urgent email recommendations:`, error);
      throw error;
    }
  }

  /**
   * Find contacts with email templates (for email campaigns list)
   */
  async findWithEmails(options = {}, currentUser = null) {
    try {
      // Apply role-based filtering
      if (currentUser) {
        let userRole;
        if (currentUser.role) {
          userRole = typeof currentUser.role === 'string' ? currentUser.role : (currentUser.role.name || currentUser.role);
        } else {
          userRole = null;
        }
        
        if (userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') {
          if (!options.where) {
            options.where = 'c.owner_id = ?';
            options.params = [currentUser.userId || currentUser.id];
          } else {
            options.where = `(${options.where}) AND c.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId || currentUser.id];
          }
        }
      }

      return await this.repository.findWithEmails(options);
    } catch (error) {
      logger.error(`Error finding contacts with emails:`, error);
      throw error;
    }
  }
}

module.exports = ContactService;

