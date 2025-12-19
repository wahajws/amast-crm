const BaseController = require('../base/BaseController');
const UserService = require('../services/UserService');
const Helpers = require('../utils/helpers');
const { ROLES } = require('../config/constants');

class UserController extends BaseController {
  constructor() {
    super(new UserService());
    this.userService = new UserService();
  }

  // Get all users (Admin only)
  index = this.asyncHandler(async (req, res) => {
    const { page, pageSize } = this.getPaginationParams(req);
    const options = {
      page,
      pageSize,
      orderBy: 'u.created_at',
      order: 'DESC',
      where: req.query.status ? 'u.status = ?' : '',
      params: req.query.status ? [req.query.status] : []
    };

    try {
      const result = await this.userService.findAll(options);
      return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
    } catch (error) {
      return this.serverError(res, 'Failed to fetch users', error);
    }
  });

  // Get single user (Admin or own profile)
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);
    
    // Users can only view their own profile unless they're admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && parseInt(id) !== currentUser.userId) {
      return this.forbidden(res, 'You can only view your own profile');
    }

    const result = await this.userService.findById(id);
    if (!result) {
      return this.notFound(res, 'User not found');
    }
    return this.success(res, result);
  });

  // Create user (Admin only)
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return this.forbidden(res, 'Only administrators can create users');
    }

    const result = await this.userService.create(req.body, currentUser);
    return this.created(res, result);
  });

  // Update user (Admin or own profile)
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);
    
    // Users can only update their own profile unless they're admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && parseInt(id) !== currentUser.userId) {
      return this.forbidden(res, 'You can only update your own profile');
    }

    // Prevent non-admins from changing role or status
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      delete req.body.roleId;
      delete req.body.status;
    }

    const result = await this.userService.update(id, req.body, currentUser);
    return this.success(res, result, 'User updated successfully');
  });

  // Delete user (Admin only)
  destroy = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return this.forbidden(res, 'Only administrators can delete users');
    }

    const { id } = req.params;
    
    // Prevent deleting yourself
    if (parseInt(id) === currentUser.userId) {
      return this.error(res, 'You cannot delete your own account', 400);
    }

    await this.userService.delete(id, currentUser);
    return this.noContent(res);
  });

  // Approve user (Admin only)
  approve = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = this.getCurrentUser(req);
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return this.forbidden(res, 'Only administrators can approve users');
    }

    try {
      const user = await this.userService.approveUser(id, currentUser.userId);
      return this.success(res, user, 'User approved successfully');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Reject user (Admin only)
  reject = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser = this.getCurrentUser(req);
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return this.forbidden(res, 'Only administrators can reject users');
    }

    try {
      await this.userService.rejectUser(id, currentUser.userId, reason);
      return this.success(res, null, 'User registration rejected');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });
}

module.exports = UserController;

