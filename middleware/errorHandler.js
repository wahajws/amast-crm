const { logger } = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Validation errors
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: err.errors || [{ message: err.message }],
      statusCode: HTTP_STATUS.BAD_REQUEST
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
      statusCode: HTTP_STATUS.UNAUTHORIZED
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired',
      statusCode: HTTP_STATUS.UNAUTHORIZED
    });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Duplicate entry',
      statusCode: HTTP_STATUS.CONFLICT
    });
  }

  // Default error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    statusCode
  });
};

module.exports = { errorHandler };







