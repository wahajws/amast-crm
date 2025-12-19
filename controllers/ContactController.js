const BaseController = require('../base/BaseController');
const ContactService = require('../services/ContactService');
const Helpers = require('../utils/helpers');

class ContactController extends BaseController {
  constructor() {
    super(new ContactService());
    this.contactService = new ContactService();
  }

  // Get all contacts
  index = this.asyncHandler(async (req, res) => {
    try {
      const { page, pageSize } = this.getPaginationParams(req);
      const currentUser = this.getCurrentUser(req);
      
      // Build search/filter options
      const options = {
        page,
        pageSize,
        orderBy: 'c.created_at',
        order: 'DESC',
        where: '',
        params: []
      };

      // Add search by name or email
      if (req.query.search) {
        options.where = '(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)';
        options.params = [`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`];
      }

      // Add status filter
      if (req.query.status) {
        if (options.where) {
          options.where += ' AND c.status = ?';
        } else {
          options.where = 'c.status = ?';
        }
        options.params.push(req.query.status);
      }

      // Add account filter
      if (req.query.accountId) {
        if (options.where) {
          options.where += ' AND c.account_id = ?';
        } else {
          options.where = 'c.account_id = ?';
        }
        options.params.push(req.query.accountId);
      }

      const result = await this.contactService.findAll(options, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.serverError(res, 'Failed to fetch contacts', error);
    }
  });

  // Get single contact
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.contactService.findById(id);
      if (!result) {
        return this.notFound(res, 'Contact not found');
      }

      // Check access
      const userRole = currentUser.role;
      if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && result.ownerId !== currentUser.userId) {
        return this.forbidden(res, 'You do not have access to this contact');
      }

      return this.success(res, result);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch contact', error);
    }
  });

  // Create contact
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user can create (VIEWER cannot)
    if (currentUser.role === 'VIEWER') {
      return this.forbidden(res, 'Viewers cannot create contacts');
    }

    try {
      const result = await this.contactService.create(req.body, currentUser);
      return this.created(res, result);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Update contact
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.contactService.update(id, req.body, currentUser);
      return this.success(res, result, 'Contact updated successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Delete contact
  destroy = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      await this.contactService.delete(id, currentUser);
      return this.noContent(res);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Get emails for a contact
  getEmails = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);
    const EmailRepository = require('../repositories/EmailRepository');
    const emailRepo = new EmailRepository();

    try {
      const contact = await this.contactService.findById(id);
      if (!contact) {
        return this.notFound(res, 'Contact not found');
      }

      // Check access
      const userRole = currentUser.role;
      if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && contact.ownerId !== currentUser.userId) {
        return this.forbidden(res, 'You do not have access to this contact');
      }

      const emails = await emailRepo.findByContactId(id, currentUser.userId);
      return this.success(res, emails);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch contact emails', error);
    }
  });
}

module.exports = ContactController;

