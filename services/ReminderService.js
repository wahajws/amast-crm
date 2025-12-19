const BaseService = require('../base/BaseService');
const ReminderRepository = require('../repositories/ReminderRepository');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');
const { ROLES } = require('../config/constants');

class ReminderService extends BaseService {
  constructor() {
    super(new ReminderRepository());
  }

  async findAll(options = {}, currentUser = null) {
    try {
      // Apply role-based filtering
      if (currentUser) {
        const userRole = currentUser.role;
        
        // VIEWER and USER roles can only see reminders for their own contacts/accounts
        if (userRole === 'VIEWER' || userRole === 'USER') {
          if (!options.where) {
            options.where = `(r.contact_id IN (SELECT id FROM contacts WHERE owner_id = ? AND deleted_at IS NULL) 
                            OR r.account_id IN (SELECT id FROM accounts WHERE owner_id = ? AND deleted_at IS NULL))`;
            options.params = [currentUser.userId, currentUser.userId];
          } else {
            options.where = `(${options.where}) AND (r.contact_id IN (SELECT id FROM contacts WHERE owner_id = ? AND deleted_at IS NULL) 
                            OR r.account_id IN (SELECT id FROM accounts WHERE owner_id = ? AND deleted_at IS NULL))`;
            options.params = [...(options.params || []), currentUser.userId, currentUser.userId];
          }
        }
        // MANAGER can see team reminders
        else if (userRole === 'MANAGER') {
          if (!options.where) {
            options.where = `(r.contact_id IN (SELECT id FROM contacts WHERE owner_id = ? AND deleted_at IS NULL) 
                            OR r.account_id IN (SELECT id FROM accounts WHERE owner_id = ? AND deleted_at IS NULL))`;
            options.params = [currentUser.userId, currentUser.userId];
          } else {
            options.where = `(${options.where}) AND (r.contact_id IN (SELECT id FROM contacts WHERE owner_id = ? AND deleted_at IS NULL) 
                            OR r.account_id IN (SELECT id FROM accounts WHERE owner_id = ? AND deleted_at IS NULL))`;
            options.params = [...(options.params || []), currentUser.userId, currentUser.userId];
          }
        }
        // SUPER_ADMIN and ADMIN can see all reminders
      }

      return await this.repository.findAll(options);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findAll:`, error);
      throw error;
    }
  }

  async findUpcoming(userId = null, limit = 10) {
    try {
      return await this.repository.findUpcoming(userId, limit);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findUpcoming:`, error);
      throw error;
    }
  }

  async create(data, user = null) {
    try {
      // Map camelCase to snake_case for database
      const mappedData = mapToSnakeCase(data);
      
      // Verify user has access to the contact/account
      if (user && (mappedData.contact_id || mappedData.account_id)) {
        const contactId = mappedData.contact_id;
        const accountId = mappedData.account_id;

        if (contactId) {
          const ContactRepository = require('../repositories/ContactRepository');
          const contactRepo = new ContactRepository();
          const contact = await contactRepo.findById(contactId);
          
          if (!contact) {
            throw new Error('Contact not found');
          }

          const userRole = user.role;
          if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && contact.ownerId !== user.userId) {
            throw new Error('You can only create reminders for your own contacts');
          }
        }

        if (accountId) {
          const AccountRepository = require('../repositories/AccountRepository');
          const accountRepo = new AccountRepository();
          const account = await accountRepo.findById(accountId);
          
          if (!account) {
            throw new Error('Account not found');
          }

          const userRole = user.role;
          if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && account.ownerId !== user.userId) {
            throw new Error('You can only create reminders for your own accounts');
          }
        }
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
          throw new Error('Reminder not found');
        }

        const userRole = user.role;
        
        // VIEWER cannot update
        if (userRole === 'VIEWER') {
          throw new Error('Viewers cannot update reminders');
        }

        // USER and MANAGER can only update their own reminders
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.createdBy !== user.userId) {
          throw new Error('You can only update your own reminders');
        }
      }

      // Map camelCase to snake_case for database
      const mappedData = mapToSnakeCase(data);
      
      // Handle status change to COMPLETED
      if (mappedData.status === 'COMPLETED' && !mappedData.completed_at) {
        mappedData.completed_at = new Date();
      } else if (mappedData.status !== 'COMPLETED' && mappedData.completed_at) {
        mappedData.completed_at = null;
      }

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
          throw new Error('Reminder not found');
        }

        const userRole = user.role;
        
        // VIEWER cannot delete
        if (userRole === 'VIEWER') {
          throw new Error('Viewers cannot delete reminders');
        }

        // USER and MANAGER can only delete their own reminders
        if ((userRole === 'USER' || userRole === 'MANAGER') && existing.createdBy !== user.userId) {
          throw new Error('You can only delete your own reminders');
        }
      }

      return await super.delete(id, user);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.delete:`, error);
      throw error;
    }
  }
}

module.exports = ReminderService;

