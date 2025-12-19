const BaseController = require('../base/BaseController');
const OpportunityService = require('../services/OpportunityService');
const Helpers = require('../utils/helpers');

class OpportunityController extends BaseController {
  constructor() {
    super(new OpportunityService());
    this.opportunityService = new OpportunityService();
  }

  // Get all opportunities
  index = this.asyncHandler(async (req, res) => {
    try {
      const { page, pageSize } = this.getPaginationParams(req);
      const currentUser = this.getCurrentUser(req);
      
      // Build search/filter options
      const options = {
        page,
        pageSize,
        orderBy: 'o.created_at',
        order: 'DESC',
        where: '',
        params: []
      };

      // Add search by name
      if (req.query.search) {
        options.where = 'o.name LIKE ?';
        options.params = [`%${req.query.search}%`];
      }

      // Add stage filter
      if (req.query.stage) {
        if (options.where) {
          options.where += ' AND o.stage = ?';
        } else {
          options.where = 'o.stage = ?';
        }
        options.params.push(req.query.stage);
      }

      // Add status filter
      if (req.query.status) {
        if (options.where) {
          options.where += ' AND o.status = ?';
        } else {
          options.where = 'o.status = ?';
        }
        options.params.push(req.query.status);
      }

      // Add account filter
      if (req.query.accountId) {
        if (options.where) {
          options.where += ' AND o.account_id = ?';
        } else {
          options.where = 'o.account_id = ?';
        }
        options.params.push(req.query.accountId);
      }

      const result = await this.opportunityService.findAll(options, currentUser);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.serverError(res, 'Failed to fetch opportunities', error);
    }
  });

  // Get single opportunity
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.opportunityService.findById(id);
      if (!result) {
        return this.notFound(res, 'Opportunity not found');
      }

      // Check access
      const userRole = currentUser.role;
      if ((userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') && result.ownerId !== currentUser.userId) {
        return this.forbidden(res, 'You do not have access to this opportunity');
      }

      return this.success(res, result);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch opportunity', error);
    }
  });

  // Create opportunity
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user can create (VIEWER cannot)
    if (currentUser.role === 'VIEWER') {
      return this.forbidden(res, 'Viewers cannot create opportunities');
    }

    try {
      const result = await this.opportunityService.create(req.body, currentUser);
      return this.created(res, result);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Update opportunity
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      const result = await this.opportunityService.update(id, req.body, currentUser);
      return this.success(res, result, 'Opportunity updated successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Delete opportunity
  destroy = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);

    try {
      await this.opportunityService.delete(id, currentUser);
      return this.noContent(res);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });
}

module.exports = OpportunityController;







