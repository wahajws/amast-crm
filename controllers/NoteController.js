const BaseController = require('../base/BaseController');
const NoteService = require('../services/NoteService');
const Helpers = require('../utils/helpers');

class NoteController extends BaseController {
  constructor() {
    super(new NoteService());
    this.noteService = new NoteService();
  }

  // Get all notes
  index = this.asyncHandler(async (req, res) => {
    try {
      const { page, pageSize } = this.getPaginationParams(req);
      const currentUser = this.getCurrentUser(req);
      
      // Build search/filter options
      const options = {
        page,
        pageSize,
        orderBy: 'n.created_at',
        order: 'DESC',
        where: '',
        params: []
      };

      // Add contact filter
      if (req.query.contactId) {
        options.where = 'n.contact_id = ?';
        options.params = [req.query.contactId];
      }

      // Add account filter
      if (req.query.accountId) {
        options.where = 'n.account_id = ?';
        options.params = [req.query.accountId];
      }

      // Add search
      if (req.query.search) {
        if (options.where) {
          options.where += ' AND (n.title LIKE ? OR n.content LIKE ?)';
        } else {
          options.where = '(n.title LIKE ? OR n.content LIKE ?)';
        }
        options.params.push(`%${req.query.search}%`, `%${req.query.search}%`);
      }

      // Add reminder filter
      if (req.query.hasReminder === 'true') {
        if (options.where) {
          options.where += ' AND n.reminder_date IS NOT NULL';
        } else {
          options.where = 'n.reminder_date IS NOT NULL';
        }
      }

      // Filter by reminder status
      if (req.query.reminderStatus) {
        if (options.where) {
          options.where += ' AND n.reminder_status = ?';
        } else {
          options.where = 'n.reminder_status = ?';
        }
        options.params.push(req.query.reminderStatus);
      }

      const result = await this.noteService.findAll(options, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.serverError(res, 'Failed to fetch notes', error);
    }
  });

  // Get notes by contact
  getByContact = this.asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const currentUser = this.getCurrentUser(req);
    const { page, pageSize } = this.getPaginationParams(req);

    try {
      const result = await this.noteService.findByContactId(contactId, { page, pageSize }, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Get notes by account
  getByAccount = this.asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const currentUser = this.getCurrentUser(req);
    const { page, pageSize } = this.getPaginationParams(req);

    try {
      const result = await this.noteService.findByAccountId(accountId, { page, pageSize }, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Get single note
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.noteService.findById(id);
      if (!result) {
        return this.notFound(res, 'Note not found');
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
            return this.forbidden(res, 'You do not have access to this note');
          }
        } else if (result.accountId) {
          const AccountRepository = require('../repositories/AccountRepository');
          const accountRepo = new AccountRepository();
          const account = await accountRepo.findById(result.accountId);
          if (account && account.ownerId !== currentUser.userId) {
            return this.forbidden(res, 'You do not have access to this note');
          }
        }
      }

      return this.success(res, result);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch note', error);
    }
  });

  // Create note
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user can create (VIEWER cannot)
    if (currentUser.role === 'VIEWER') {
      return this.forbidden(res, 'Viewers cannot create notes');
    }

    try {
      const result = await this.noteService.create(req.body, currentUser);
      return this.created(res, result);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Update note
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.noteService.update(id, req.body, currentUser);
      return this.success(res, result, 'Note updated successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Delete note
  destroy = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      await this.noteService.delete(id, currentUser);
      return this.noContent(res);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Mark note reminder as complete
  markReminderComplete = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.noteService.update(id, { 
        reminderStatus: 'COMPLETED',
        reminderCompletedAt: new Date()
      }, currentUser);
      return this.success(res, result, 'Reminder marked as complete');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });
}

module.exports = NoteController;



