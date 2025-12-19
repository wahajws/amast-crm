const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const authController = new AuthController();

// Rate limiter for login attempts (prevent brute force)
// NOTE: This rate limiter is used in routes, so it will receive req from the main app
// The main app's trust proxy setting applies here as well
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per 15 minutes (increased for better UX)
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Custom keyGenerator: Use req.ip which is correctly set by Express when trust proxy is configured
  keyGenerator: (req) => {
    // req.ip is automatically set by Express based on trust proxy configuration
    return req.ip || req.socket?.remoteAddress || 'unknown';
  },
  // Disable trust proxy validation - trust proxy is configured in server.js
  // This prevents the ERR_ERL_PERMISSIVE_TRUST_PROXY error
  validate: {
    trustProxy: false
  }
});

// Login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Refresh token
router.post('/refresh', authController.refresh);

// Logout
router.post('/logout', authenticate, authController.logout);

// Get current user
router.get('/me', authenticate, authController.me);

// Gmail OAuth
router.get('/gmail', authController.gmailAuth);
router.get('/gmail/callback', authController.gmailCallback);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

// User Registration
router.post('/register', authController.register);

module.exports = router;

