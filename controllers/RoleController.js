const BaseController = require('../base/BaseController');
const RoleService = require('../services/RoleService');
const Helpers = require('../utils/helpers');

class RoleController extends BaseController {
  constructor() {
    super(new RoleService());
    this.roleService = new RoleService();
  }

  // Get all roles
  index = this.asyncHandler(async (req, res) => {
    try {
      const result = await this.roleService.findAll({ pageSize: 1000 });
      // Return just the data array (roles list)
      return this.success(res, result.data || []);
    } catch (error) {
      return this.serverError(res, 'Failed to fetch roles', error);
    }
  });

  // Get single role
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await this.roleService.findById(id);
    
    if (!result) {
      return this.notFound(res, 'Role not found');
    }
    
    return this.success(res, result);
  });

  // Create role (Admin only)
  store = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return this.forbidden(res, 'Only administrators can create roles');
    }

    const result = await this.roleService.create(req.body, currentUser);
    return this.created(res, result);
  });

  // Update role (Admin only)
  update = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return this.forbidden(res, 'Only administrators can update roles');
    }

    const { id } = req.params;
    
    // Check if it's a system role (cannot be modified)
    const existing = await this.roleService.findById(id);
    if (existing && existing.isSystemRole) {
      return this.error(res, 'System roles cannot be modified', 400);
    }

    const result = await this.roleService.update(id, req.body, currentUser);
    return this.success(res, result, 'Role updated successfully');
  });

  // Delete role (Admin only)
  destroy = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return this.forbidden(res, 'Only administrators can delete roles');
    }

    const { id } = req.params;
    
    // Check if it's a system role (cannot be deleted)
    const existing = await this.roleService.findById(id);
    if (existing && existing.isSystemRole) {
      return this.error(res, 'System roles cannot be deleted', 400);
    }

    await this.roleService.delete(id, currentUser);
    return this.noContent(res);
  });
}

module.exports = RoleController;
