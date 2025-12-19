class Helpers {
  /**
   * Format API response
   */
  static successResponse(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      message,
      data,
      statusCode
    };
  }

  /**
   * Format error response
   */
  static errorResponse(message, statusCode = 400, errors = null) {
    const response = {
      success: false,
      message,
      statusCode
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }

  /**
   * Paginate results
   */
  static paginate(data, page = 1, pageSize = 10, total = 0) {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Sanitize input
   */
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    return input;
  }

  /**
   * Generate random string
   */
  static generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Extract pagination params from request
   */
  static getPaginationParams(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    return { page, pageSize, offset };
  }
}

module.exports = Helpers;







