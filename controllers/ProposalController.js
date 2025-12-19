const BaseController = require('../base/BaseController');
const ProposalService = require('../services/ProposalService');
const Helpers = require('../utils/helpers');

class ProposalController extends BaseController {
  constructor() {
    super(new ProposalService());
    this.proposalService = new ProposalService();
  }

  // Get all proposals
  index = this.asyncHandler(async (req, res) => {
    try {
      const { page, pageSize } = this.getPaginationParams(req);
      const currentUser = this.getCurrentUser(req);
      
      // Build search/filter options
      const options = {
        page,
        pageSize,
        orderBy: 'p.created_at',
        order: 'DESC',
        where: '',
        params: []
      };

      // Add search by title
      if (req.query.search) {
        options.where = 'p.title LIKE ?';
        options.params = [`%${req.query.search}%`];
      }

      // Add status filter
      if (req.query.status) {
        if (options.where) {
          options.where += ' AND p.status = ?';
        } else {
          options.where = 'p.status = ?';
        }
        options.params.push(req.query.status);
      }

      // Add opportunity filter
      if (req.query.opportunityId) {
        if (options.where) {
          options.where += ' AND p.opportunity_id = ?';
        } else {
          options.where = 'p.opportunity_id = ?';
        }
        options.params.push(req.query.opportunityId);
      }

      // Add account filter
      if (req.query.accountId) {
        if (options.where) {
          options.where += ' AND p.account_id = ?';
        } else {
          options.where = 'p.account_id = ?';
        }
        options.params.push(req.query.accountId);
      }

      const result = await this.proposalService.findAll(options, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.serverError(res, 'Failed to fetch proposals', error);
    }
  });

  // Get single proposal
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.proposalService.findById(id);
      if (!result) {
        return this.notFound(res, 'Proposal not found');
      }

      // Check access
      const userRole = currentUser.role;
      if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && result.ownerId !== currentUser.userId) {
        return this.forbidden(res, 'You do not have access to this proposal');
      }

      return this.success(res, result);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch proposal', error);
    }
  });

  // Create proposal
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user can create (VIEWER cannot)
    if (currentUser.role === 'VIEWER') {
      return this.forbidden(res, 'Viewers cannot create proposals');
    }

    try {
      const result = await this.proposalService.create(req.body, currentUser);
      return this.created(res, result);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Update proposal
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.proposalService.update(id, req.body, currentUser);
      return this.success(res, result, 'Proposal updated successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Delete proposal
  destroy = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      await this.proposalService.delete(id, currentUser);
      return this.noContent(res);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });
}

module.exports = ProposalController;







