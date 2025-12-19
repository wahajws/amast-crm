const AuthService = require('../services/AuthService');
const { logger } = require('../utils/logger');

const authService = new AuthService();

async function authenticate(req, res, next) {
  try {
    // Get token from header or body
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7).trim(); // Remove 'Bearer ' and trim whitespace
    } else {
      token = req.body?.token || req.query?.token;
      if (token) {
        token = token.trim();
      }
    }

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
        statusCode: 401
      });
    }

    // Verify token
    const decoded = await authService.verifyToken(token);

    // Attach user info to request
    // Normalize user object - ensure both id and userId are available
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id
    };
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      statusCode: 401
    });
  }
}

module.exports = { authenticate };







