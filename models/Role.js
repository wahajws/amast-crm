const BaseModel = require('../base/BaseModel');

class Role extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.name = data.name || null;
    this.displayName = data.display_name || data.displayName || null;
    this.description = data.description || null;
    this.isSystemRole = data.is_system_role || data.isSystemRole || false;
    this.permissions = data.permissions || [];
  }

  static getTableName() {
    return 'roles';
  }

  static getFillableFields() {
    return ['name', 'display_name', 'description', 'is_system_role'];
  }

  validate() {
    const errors = [];

    if (!this.name) {
      errors.push('Role name is required');
    }

    if (!this.displayName) {
      errors.push('Display name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Role;







