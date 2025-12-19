const BaseController = require('../base/BaseController');
const ReminderService = require('../services/ReminderService');
const Helpers = require('../utils/helpers');
const { logger } = require('../utils/logger');

class ReminderController extends BaseController {
  constructor() {
    super(new ReminderService());
    this.reminderService = new ReminderService();
  }

  // Get all reminders
  index = this.asyncHandler(async (req, res) => {
    try {
      const { page, pageSize } = this.getPaginationParams(req);
      const currentUser = this.getCurrentUser(req);
      
      // Build search/filter options
      const options = {
        page,
        pageSize,
        orderBy: 'r.due_date',
        order: 'ASC',
        where: '',
        params: []
      };

      // Add contact filter
      if (req.query.contactId) {
        options.where = 'r.contact_id = ?';
        options.params = [req.query.contactId];
      }

      // Add account filter
      if (req.query.accountId) {
        options.where = 'r.account_id = ?';
        options.params = [req.query.accountId];
      }

      // Add status filter
      if (req.query.status) {
        if (options.where) {
          options.where += ' AND r.status = ?';
        } else {
          options.where = 'r.status = ?';
        }
        options.params.push(req.query.status);
      }

      // Add priority filter
      if (req.query.priority) {
        if (options.where) {
          options.where += ' AND r.priority = ?';
        } else {
          options.where = 'r.priority = ?';
        }
        options.params.push(req.query.priority);
      }

      const result = await this.reminderService.findAll(options, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.serverError(res, 'Failed to fetch reminders', error);
    }
  });

  // Get upcoming reminders
  getUpcoming = this.asyncHandler(async (req, res) => {
    try {
      const currentUser = this.getCurrentUser(req);
      const limit = parseInt(req.query.limit) || 10;

      // Determine userId based on role - only restrict for non-admin roles
      let userId = null;
      const userRole = currentUser.role?.name || currentUser.role;
      
      if (userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') {
        userId = currentUser.userId;
      }
      // SUPER_ADMIN and ADMIN can see all reminders (userId = null)
      
      const reminders = await this.reminderService.findUpcoming(userId, limit);
      
      // Convert reminders to JSON format for response
      const formattedReminders = reminders.map(reminder => {
        const reminderData = reminder.toJSON ? reminder.toJSON() : reminder;
        return reminderData;
      });
      
      return this.success(res, formattedReminders);
    } catch (error) {
      logger.error('Error fetching upcoming reminders:', error);
      return this.serverError(res, 'Failed to fetch upcoming reminders', error);
    }
  });

  // Get single reminder
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.reminderService.findById(id);
      if (!result) {
        return this.notFound(res, 'Reminder not found');
      }

      // Check access based on linked contact/account
      const userRole = currentUser.role;
      if (userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') {
        // Verify access to the linked contact or account
        if (result.contactId) {
          const ContactRepository = require('../repositories/ContactRepository');
          const contactRepo = new ContactRepository();
          const contact = await contactRepo.findById(result.contactId);
          if (contact && contact.ownerId !== currentUser.userId) {
            return this.forbidden(res, 'You do not have access to this reminder');
          }
        } else if (result.accountId) {
          const AccountRepository = require('../repositories/AccountRepository');
          const accountRepo = new AccountRepository();
          const account = await accountRepo.findById(result.accountId);
          if (account && account.ownerId !== currentUser.userId) {
            return this.forbidden(res, 'You do not have access to this reminder');
          }
        }
      }

      return this.success(res, result);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch reminder', error);
    }
  });

  // Create reminder
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user can create (VIEWER cannot)
    if (currentUser.role === 'VIEWER') {
      return this.forbidden(res, 'Viewers cannot create reminders');
    }

    try {
      const result = await this.reminderService.create(req.body, currentUser);
      return this.created(res, result);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Update reminder
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.reminderService.update(id, req.body, currentUser);
      return this.success(res, result, 'Reminder updated successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Mark reminder as complete
  markComplete = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.reminderService.update(id, { status: 'COMPLETED' }, currentUser);
      return this.success(res, result, 'Reminder marked as complete');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Delete reminder
  destroy = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      await this.reminderService.delete(id, currentUser);
      return this.noContent(res);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });
}

module.exports = ReminderController;

