const { ROLES } = require('../config/constants');

/**
 * Authorization middleware - Check if user has required role
 * @param {...string} allowedRoles - Roles that are allowed to access
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        statusCode: 401
      });
    }

    const userRole = req.user.role;

    // SUPER_ADMIN has access to everything
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Admin access required.',
        statusCode: 403
      });
    }

    next();
  };
}

/**
 * Middleware to check if user is admin (SUPER_ADMIN or ADMIN)
 */
function requireAdmin(req, res, next) {
  return authorize('SUPER_ADMIN', 'ADMIN')(req, res, next);
}

module.exports = { authorize, requireAdmin };







