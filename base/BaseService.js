const { logger } = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Base Service Class
 * All services should extend this class
 */
class BaseService {
  constructor(repository) {
    if (!repository) {
      throw new Error('Repository is required for service');
    }
    this.repository = repository;
  }

  /**
   * Find by ID
   */
  async findById(id) {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      const result = await this.repository.findById(id);
      if (!result) {
        throw new Error('Record not found');
      }

      return result;
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findById:`, error);
      throw error;
    }
  }

  /**
   * Find all with pagination
   */
  async findAll(options = {}) {
    try {
      return await this.repository.findAll(options);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findAll:`, error);
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(data, user = null) {
    try {
      // Add created_by if user is provided
      if (user && data.hasOwnProperty('createdBy')) {
        data.createdBy = user.id;
      }

      // Validate data before creating
      const validation = this.validate(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      return await this.repository.create(data);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.create:`, error);
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(id, data, user = null) {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      // Check if record exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new Error('Record not found');
      }

      // Add updated_by if user is provided
      if (user && data.hasOwnProperty('updatedBy')) {
        data.updatedBy = user.id;
      }

      // Validate data before updating
      const validation = this.validate(data, existing);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      return await this.repository.update(id, data);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.update:`, error);
      throw error;
    }
  }

  /**
   * Delete record
   */
  async delete(id, user = null) {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new Error('Record not found');
      }

      return await this.repository.delete(id);
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.delete:`, error);
      throw error;
    }
  }

  /**
   * Validate data
   * Override in child classes
   */
  validate(data, existing = null) {
    return { isValid: true, errors: [] };
  }

  /**
   * Handle service errors
   */
  handleError(error, defaultMessage = 'An error occurred') {
    if (error.message) {
      return error;
    }
    return new Error(defaultMessage);
  }
}

module.exports = BaseService;







