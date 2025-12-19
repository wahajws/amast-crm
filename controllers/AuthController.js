const BaseController = require('../base/BaseController');
const AuthService = require('../services/AuthService');
const GmailService = require('../services/GmailService');
const UserService = require('../services/UserService');
const UserRepository = require('../repositories/UserRepository');
const RoleRepository = require('../repositories/RoleRepository');
const { logger } = require('../utils/logger');

class AuthController extends BaseController {
  constructor() {
    super(new AuthService());
    this.authService = new AuthService();
    this.gmailService = new GmailService();
    this.userService = new UserService();
  }

  login = this.asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return this.error(res, 'Email and password are required', 400);
    }

    try {
      const result = await this.authService.login(email, password);
      return this.success(res, result, 'Login successful');
    } catch (error) {
      return this.error(res, error.message, 401);
    }
  });

  refresh = this.asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return this.error(res, 'Refresh token is required', 400);
    }

    try {
      const tokens = await this.authService.refreshToken(refreshToken);
      // Return in same format as login for consistency
      return this.success(res, {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }, 'Token refreshed successfully');
    } catch (error) {
      return this.error(res, error.message, 401);
    }
  });

  logout = this.asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

    if (!token) {
      return this.error(res, 'Token is required', 400);
    }

    try {
      await this.authService.logout(token);
      return this.success(res, null, 'Logout successful');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  me = this.asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return this.unauthorized(res, 'Not authenticated');
    }

    try {
      const user = await this.authService.getCurrentUser(userId);
      return this.success(res, user);
    } catch (error) {
      return this.error(res, error.message, 404);
    }
  });

  gmailAuth = this.asyncHandler(async (req, res) => {
    try {
      const authUrl = this.gmailService.getAuthUrl();
      return res.redirect(authUrl);
    } catch (error) {
      return this.error(res, 'Failed to initiate Gmail authentication', 500);
    }
  });

  gmailCallback = this.asyncHandler(async (req, res) => {
    try {
      const { code, error } = req.query;

      if (error) {
        return res.redirect(`/login?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        return res.redirect('/login?error=missing_code');
      }

      // Get tokens from Google
      const tokens = await this.gmailService.getTokens(code);
      
      // Get user info from Google
      const googleUser = await this.gmailService.getUserInfo(tokens.access_token);

      // Find or create user
      const userRepo = new UserRepository();
      const roleRepo = new RoleRepository();
      
      let user = await userRepo.findByEmail(googleUser.email);

      if (!user) {
        // Create new user with default USER role
        const sql = `SELECT * FROM roles WHERE name = ? LIMIT 1`;
        const roleResults = await roleRepo.query(sql, ['USER']);
        const defaultRole = roleResults.length > 0 ? roleRepo.model.fromDatabaseRow(roleResults[0]) : null;

        if (!defaultRole) {
          return res.redirect('/login?error=role_not_found');
        }

        user = await userRepo.create({
          email: googleUser.email,
          first_name: googleUser.given_name || '',
          last_name: googleUser.family_name || '',
          profile_picture: googleUser.picture || null,
          role_id: defaultRole.id,
          status: 'ACTIVE',
          gmail_access_token: tokens.access_token,
          gmail_refresh_token: tokens.refresh_token,
          gmail_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        });
      } else {
        // Update existing user's Gmail tokens
        await userRepo.update(user.id, {
          gmail_access_token: tokens.access_token,
          gmail_refresh_token: tokens.refresh_token,
          gmail_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          last_login: new Date()
        });
        user = await userRepo.findById(user.id);
      }

      // Generate JWT tokens
      const authTokens = await this.authService.generateTokens(user);

      // Create session
      const SessionRepository = require('../repositories/SessionRepository');
      const sessionRepo = new SessionRepository();
      await sessionRepo.create({
        userId: user.id,
        token: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(
        `${frontendUrl}/auth/callback?token=${authTokens.accessToken}&refreshToken=${authTokens.refreshToken}`
      );
    } catch (error) {
      logger.error('Gmail callback error:', error);
      return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
  });

  // Request password reset
  forgotPassword = this.asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return this.error(res, 'Email is required', 400);
    }

    try {
      const result = await this.authService.requestPasswordReset(email);
      return this.success(res, result, result.message);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Verify reset token
  verifyResetToken = this.asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      return this.error(res, 'Token is required', 400);
    }

    try {
      const result = await this.authService.verifyResetToken(token);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Reset password
  resetPassword = this.asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return this.error(res, 'Token and password are required', 400);
    }

    try {
      const result = await this.authService.resetPassword(token, password);
      return this.success(res, result, result.message);
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });

  // Register new user
  register = this.asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return this.error(res, 'Email and password are required', 400);
    }

    try {
      const result = await this.userService.register({
        email,
        password,
        firstName,
        lastName
      });
      return this.success(res, result, result.message || 'Registration successful. Please wait for admin approval.');
    } catch (error) {
      return this.error(res, error.message, 400);
    }
  });
}

module.exports = AuthController;

