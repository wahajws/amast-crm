const BaseService = require('../base/BaseService');
const RoleRepository = require('../repositories/RoleRepository');
const { logger } = require('../utils/logger');

class RoleService extends BaseService {
  constructor() {
    super(new RoleRepository());
  }

  async findAll(options = {}) {
    try {
      // Roles table doesn't have deleted_at, so we override
      const result = await this.repository.findAll(options);
      return result;
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findAll:`, error);
      throw error;
    }
  }
}

module.exports = RoleService;







