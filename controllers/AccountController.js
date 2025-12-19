const BaseController = require('../base/BaseController');
const AccountService = require('../services/AccountService');
const Helpers = require('../utils/helpers');
const { logger } = require('../utils/logger');

class AccountController extends BaseController {
  constructor() {
    super(new AccountService());
    this.accountService = new AccountService();
  }

  // Get all accounts
  index = this.asyncHandler(async (req, res) => {
    try {
      const { page, pageSize } = this.getPaginationParams(req);
      const currentUser = this.getCurrentUser(req);
      
      // Build search/filter options
      const options = {
        page,
        pageSize,
        orderBy: 'a.created_at',
        order: 'DESC',
        where: '',
        params: []
      };

      // Add search by name
      if (req.query.search) {
        options.where = 'a.name LIKE ?';
        options.params = [`%${req.query.search}%`];
      }

      // Add status filter
      if (req.query.status) {
        if (options.where) {
          options.where += ' AND a.status = ?';
        } else {
          options.where = 'a.status = ?';
        }
        options.params.push(req.query.status);
      }

      const result = await this.accountService.findAll(options, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.serverError(res, 'Failed to fetch accounts', error);
    }
  });

  // Get single account
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.accountService.findById(id);
      if (!result) {
        return this.notFound(res, 'Account not found');
      }

      // Check access
      const userRole = currentUser.role;
      if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && result.ownerId !== currentUser.userId) {
        return this.forbidden(res, 'You do not have access to this account');
      }

      return this.success(res, result);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch account', error);
    }
  });

  // Create account
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user can create (VIEWER cannot)
    if (currentUser.role === 'VIEWER') {
      return this.forbidden(res, 'Viewers cannot create accounts');
    }

    try {
      const result = await this.accountService.create(req.body, currentUser);
      return this.created(res, result);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Update account
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.accountService.update(id, req.body, currentUser);
      return this.success(res, result, 'Account updated successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Delete account
  destroy = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      await this.accountService.delete(id, currentUser);
      return this.noContent(res);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Get emails for an account
  getEmails = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);
    const EmailRepository = require('../repositories/EmailRepository');
    const emailRepo = new EmailRepository();

    try {
      const account = await this.accountService.findById(id);
      if (!account) {
        return this.notFound(res, 'Account not found');
      }

      // Check access
      const userRole = currentUser.role;
      if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && account.ownerId !== currentUser.userId) {
        return this.forbidden(res, 'You do not have access to this account');
      }

      const emails = await emailRepo.findByAccountId(id, currentUser.userId);
      return this.success(res, emails);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch account emails', error);
    }
  });

  // Get accounts with email counts
  getAccountsWithEmailCounts = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const AccountRepository = require('../repositories/AccountRepository');
    const accountRepo = new AccountRepository();

    try {
      const userId = currentUser.userId || currentUser.id;
      // Pass currentUser for role-based filtering
      const accounts = await accountRepo.getAccountsWithEmailCounts(userId, currentUser);
      
      // Filter out accounts with 0 emails if requested
      const { includeEmpty } = req.query;
      const filteredAccounts = includeEmpty === 'true' 
        ? accounts 
        : accounts.filter(acc => acc && acc.emailCount > 0);
      
      return this.success(res, filteredAccounts);
    } catch (error) {
      logger.error('Error fetching accounts with email counts:', error);
      return this.serverError(res, 'Failed to fetch accounts with email counts', error);
    }
  });
}

module.exports = AccountController;

