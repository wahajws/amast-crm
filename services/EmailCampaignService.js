const BaseService = require('../base/BaseService');
const EmailCampaignRepository = require('../repositories/EmailCampaignRepository');
const EmailCampaign = require('../models/EmailCampaign');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');
const { ROLES } = require('../config/constants');

class EmailCampaignService extends BaseService {
  constructor() {
    super(new EmailCampaignRepository());
  }

  async findAll(options = {}, currentUser = null) {
    try {
      // Apply role-based filtering
      if (currentUser) {
        let userRole;
        if (currentUser.role) {
          userRole = typeof currentUser.role === 'string' ? currentUser.role : (currentUser.role.name || currentUser.role);
        } else {
          userRole = null;
        }
        
        // VIEWER and USER roles can only see their own campaigns
        if (userRole === 'VIEWER' || userRole === 'USER') {
          if (!options.where) {
            options.where = 'ec.owner_id = ?';
            options.params = [currentUser.userId || currentUser.id];
          } else {
            options.where = `(${options.where}) AND ec.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId || currentUser.id];
          }
        }
        // MANAGER can see team campaigns
        else if (userRole === 'MANAGER') {
          if (!options.where) {
            options.where = 'ec.owner_id = ?';
            options.params = [currentUser.userId || currentUser.id];
          } else {
            options.where = `(${options.where}) AND ec.owner_id = ?`;
            options.params = [...(options.params || []), currentUser.userId || currentUser.id];
          }
        }
        // SUPER_ADMIN and ADMIN can see all campaigns
      }

      return await this.repository.findAll(options);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findAll:`, error);
      throw error;
    }
  }

  async create(data, user = null) {
    try {
      const mappedData = mapToSnakeCase(data);
      
      // Set owner_id to current user if not provided
      if (user && !mappedData.owner_id && !mappedData.ownerId) {
        mappedData.owner_id = user.userId || user.id;
      }
      
      // Set created_by
      if (user) {
        mappedData.created_by = user.id || user.userId;
      }

      return await super.create(mappedData, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.create:`, error);
      throw error;
    }
  }

  async update(id, data, user = null) {
    try {
      if (user) {
        const existing = await this.repository.findById(id);
        if (!existing) {
          throw new Error('Email campaign not found');
        }

        let userRole;
        if (user.role) {
          userRole = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
        } else {
          userRole = null;
        }
        
        // VIEWER cannot update
        if (userRole === 'VIEWER') {
          throw new Error('Viewers cannot update email campaigns');
        }

        // USER and MANAGER can only update their own campaigns
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.ownerId !== (user.userId || user.id)) {
          throw new Error('You can only update your own email campaigns');
        }
        
        // Set updated_by
        data.updated_by = user.id || user.userId;
      }

      const mappedData = mapToSnakeCase(data);
      return await super.update(id, mappedData, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.update:`, error);
      throw error;
    }
  }

  /**
   * Mark email as sent
   */
  async markAsSent(id, userId) {
    try {
      const updateData = {
        status: 'SENT',
        sentAt: new Date(),
        sentBy: userId,
      };
      
      return await this.update(id, updateData, { id: userId, userId: userId });
    } catch (error) {
      logger.error(`Error marking email as sent:`, error);
      throw error;
    }
  }

  /**
   * Toggle communication started
   */
  async toggleCommunicationStarted(id, started, userId) {
    try {
      const updateData = {
        communicationStarted: started,
      };
      
      // If marking as started and not already sent, also mark as sent
      if (started) {
        const campaign = await this.repository.findById(id);
        if (campaign && campaign.status === 'PENDING') {
          updateData.status = 'SENT';
          updateData.sentAt = new Date();
          updateData.sentBy = userId;
        }
      }
      
      return await this.update(id, updateData, { id: userId, userId: userId });
    } catch (error) {
      logger.error(`Error toggling communication started:`, error);
      throw error;
    }
  }

  /**
   * Get analytics for dashboard (based on contacts with emails)
   */
  async getAnalytics(userId = null) {
    try {
      const ContactService = require('./ContactService');
      const contactService = new ContactService();
      return await contactService.getEmailAnalytics(userId);
    } catch (error) {
      logger.error(`Error getting analytics:`, error);
      throw error;
    }
  }

  /**
   * Get urgent recommendations (based on contacts with emails)
   */
  async getUrgentRecommendations(userId = null, limit = 10) {
    try {
      const ContactService = require('./ContactService');
      const contactService = new ContactService();
      return await contactService.getUrgentEmailRecommendations(userId, limit);
    } catch (error) {
      logger.error(`Error getting urgent recommendations:`, error);
      throw error;
    }
  }

  /**
   * Find campaign by contact ID
   */
  async findByContactId(contactId) {
    try {
      const deletedAtCol = require('../utils/fieldMapper').getSoftDeleteColumn();
      const sql = `SELECT * FROM ${this.repository.tableName} WHERE contact_id = ? AND ${deletedAtCol} IS NULL LIMIT 1`;
      const results = await this.repository.query(sql, [contactId]);
      if (results.length > 0) {
        const campaign = EmailCampaign.fromDatabaseRow(results[0]);
        return campaign;
      }
      return null;
    } catch (error) {
      logger.error(`Error finding campaign by contact ID:`, error);
      throw error;
    }
  }

  /**
   * Bulk mark as sent
   */
  async bulkMarkAsSent(ids, userId) {
    try {
      const results = [];
      for (const id of ids) {
        try {
          const updated = await this.markAsSent(id, userId);
          results.push({ id, success: true, campaign: updated });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }
      return results;
    } catch (error) {
      logger.error(`Error in bulk mark as sent:`, error);
      throw error;
    }
  }
}

module.exports = EmailCampaignService;

