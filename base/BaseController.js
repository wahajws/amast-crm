const { logger } = require('../utils/logger');
const Helpers = require('../utils/helpers');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Base Controller Class
 * All controllers should extend this class
 */
class BaseController {
  constructor(service = null) {
    // Service is optional - some controllers use multiple services/repositories
    this.service = service;
  }

  /**
   * Handle success response
   */
  success(res, data, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json(Helpers.successResponse(data, message, statusCode));
  }

  /**
   * Handle error response
   */
  error(res, message, statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) {
    return res.status(statusCode).json(Helpers.errorResponse(message, statusCode, errors));
  }

  /**
   * Handle created response
   */
  created(res, data, message = 'Created successfully') {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * Handle no content response
   */
  noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  /**
   * Handle not found response
   */
  notFound(res, message = 'Resource not found') {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * Handle unauthorized response
   */
  unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * Handle forbidden response
   */
  forbidden(res, message = 'Forbidden') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * Handle server error response
   */
  serverError(res, message = 'Internal server error', error = null) {
    if (error) {
      logger.error('Server error:', error);
    }
    return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  /**
   * Async handler wrapper to catch errors
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Get current user from request
   */
  getCurrentUser(req) {
    return req.user || null;
  }

  /**
   * Get pagination params from request
   */
  getPaginationParams(req) {
    return Helpers.getPaginationParams(req);
  }

  /**
   * Index - Get all records
   */
  index = this.asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = this.getPaginationParams(req);
    const options = {
      page,
      pageSize,
      ...req.query
    };

    const result = await this.service.findAll(options);
    return this.success(res, Helpers.paginate(result.data, page, pageSize, result.total));
  });

  /**
   * Show - Get single record
   */
  show = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.findById(id);
    
    if (!result) {
      return this.notFound(res);
    }

    return this.success(res, result);
  });

  /**
   * Store - Create new record
   */
  store = this.asyncHandler(async (req, res) => {
    const user = this.getCurrentUser(req);
    const result = await this.service.create(req.body, user);
    return this.created(res, result);
  });

  /**
   * Update - Update existing record
   */
  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = this.getCurrentUser(req);
    const result = await this.service.update(id, req.body, user);
    return this.success(res, result, 'Updated successfully');
  });

  /**
   * Destroy - Delete record
   */
  destroy = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = this.getCurrentUser(req);
    await this.service.delete(id, user);
    return this.noContent(res);
  });
}

module.exports = BaseController;

