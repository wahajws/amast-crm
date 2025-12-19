const BaseController = require('../base/BaseController');
const GmailLabelService = require('../services/GmailLabelService');
const EmailSyncService = require('../services/EmailSyncService');
const UserRepository = require('../repositories/UserRepository');
const { logger } = require('../utils/logger');

class GmailController extends BaseController {
  constructor() {
    super();
    this.gmailLabelService = new GmailLabelService();
    this.emailSyncService = new EmailSyncService();
    this.userRepository = new UserRepository();
  }

  /**
   * Get full user with Gmail tokens from database
   */
  async getFullUser(req) {
    const currentUser = this.getCurrentUser(req);
    if (!currentUser || !currentUser.userId) {
      return null;
    }
    const fullUser = await this.userRepository.findById(currentUser.userId);
    return fullUser;
  }

  /**
   * GET /api/gmail/labels
   * Get user's Gmail labels with sync status
   */
  getLabels = this.asyncHandler(async (req, res) => {
    const user = await this.getFullUser(req);
    if (!user) {
      return this.unauthorized(res, 'User not found');
    }

    if (!user.gmailAccessToken) {
      return this.error(res, 'Gmail account not connected. Please connect your Gmail account first.', 400);
    }

    try {
      const labels = await this.gmailLabelService.getUserLabels(user);
      return this.success(res, labels);
    } catch (error) {
      logger.error('Error fetching Gmail labels:', error);
      return this.serverError(res, 'Failed to fetch Gmail labels', error);
    }
  });

  /**
   * POST /api/gmail/labels/sync
   * Sync/refresh user's Gmail labels from Gmail API
   * Optionally auto-enable all user labels for smart CRM
   */
  syncLabels = this.asyncHandler(async (req, res) => {
    const user = await this.getFullUser(req);
    if (!user) {
      return this.unauthorized(res, 'User not found');
    }

    if (!user.gmailAccessToken) {
      return this.error(res, 'Gmail account not connected', 400);
    }

    try {
      const labels = await this.gmailLabelService.syncUserLabels(user);
      
      // Auto-enable sync for all user-created labels (smart CRM feature)
      // This automatically syncs customer labels
      if (req.body.autoEnableUserLabels !== false) {
        await this.gmailLabelService.autoEnableUserLabels(user);
        // Refresh labels to get updated sync status
        const updatedLabels = await this.gmailLabelService.getUserLabels(user);
        return this.success(res, updatedLabels, 'Labels synced and auto-enabled for smart CRM');
      }
      
      return this.success(res, labels, 'Labels synced successfully');
    } catch (error) {
      logger.error('Error syncing Gmail labels:', error);
      return this.serverError(res, 'Failed to sync Gmail labels', error);
    }
  });

  /**
   * PUT /api/gmail/labels/sync-settings
   * Update which labels user wants to sync
   */
  updateSyncSettings = this.asyncHandler(async (req, res) => {
    const user = await this.getFullUser(req);
    if (!user) {
      return this.unauthorized(res, 'User not found');
    }
    const { labelIds, isSyncing } = req.body;

    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return this.error(res, 'labelIds must be a non-empty array', 400);
    }

    if (typeof isSyncing !== 'boolean') {
      return this.error(res, 'isSyncing must be a boolean', 400);
    }

    try {
      await this.gmailLabelService.updateSyncSettings(user, labelIds, isSyncing);
      return this.success(res, null, 'Sync settings updated successfully');
    } catch (error) {
      logger.error('Error updating sync settings:', error);
      return this.serverError(res, 'Failed to update sync settings', error);
    }
  });

  /**
   * GET /api/gmail/labels/syncing
   * Get labels that user has selected to sync
   */
  getSyncingLabels = this.asyncHandler(async (req, res) => {
    const user = await this.getFullUser(req);
    if (!user) {
      return this.unauthorized(res, 'User not found');
    }

    try {
      const labels = await this.gmailLabelService.getSyncingLabels(user);
      return this.success(res, labels);
    } catch (error) {
      logger.error('Error fetching syncing labels:', error);
      return this.serverError(res, 'Failed to fetch syncing labels', error);
    }
  });

  /**
   * POST /api/gmail/sync
   * Sync emails from selected labels
   */
  syncEmails = this.asyncHandler(async (req, res) => {
    const user = await this.getFullUser(req);
    if (!user) {
      return this.unauthorized(res, 'User not found');
    }
    const { labelId } = req.body;

    if (!user.gmailAccessToken) {
      return this.error(res, 'Gmail account not connected', 400);
    }

    try {
      if (labelId) {
        // Sync specific label
        const result = await this.emailSyncService.syncLabelEmails(user, labelId, 'manual');
        return this.success(res, result, 'Emails synced successfully');
      } else {
        // Sync all selected labels
        const results = await this.emailSyncService.syncAllLabels(user, 'manual');
        return this.success(res, results, 'Emails synced successfully');
      }
    } catch (error) {
      logger.error('Error syncing emails:', error);
      return this.serverError(res, 'Failed to sync emails', error);
    }
  });

  /**
   * GET /api/gmail/sync/status
   * Get sync status and history
   */
  getSyncStatus = this.asyncHandler(async (req, res) => {
    const user = await this.getFullUser(req);
    if (!user) {
      return this.unauthorized(res, 'User not found');
    }
    const EmailSyncLogRepository = require('../repositories/EmailSyncLogRepository');
    const syncLogRepo = new EmailSyncLogRepository();

    try {
      const logs = await syncLogRepo.findByUserId(user.id, 20);
      return this.success(res, logs);
    } catch (error) {
      logger.error('Error fetching sync status:', error);
      return this.serverError(res, 'Failed to fetch sync status', error);
    }
  });
}

module.exports = GmailController;

