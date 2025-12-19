const GmailService = require('./GmailService');
const GmailLabelSyncRepository = require('../repositories/GmailLabelSyncRepository');
const { logger } = require('../utils/logger');

class GmailLabelService {
  constructor() {
    this.gmailService = new GmailService();
    this.labelSyncRepo = new GmailLabelSyncRepository();
  }

  /**
   * Fetch and sync user's Gmail labels
   */
  async syncUserLabels(user) {
    try {
      // Get labels from Gmail API
      const gmailLabels = await this.gmailService.getUserLabels(user);

      // Process each label
      const labels = [];
      for (const gmailLabel of gmailLabels) {
        // Determine label type
        const labelType = this.determineLabelType(gmailLabel.id);

        // Upsert label in database
        await this.labelSyncRepo.upsertLabelSync(user.id, {
          labelId: gmailLabel.id,
          labelName: gmailLabel.name,
          labelType: labelType,
          isSyncing: false // Default to not syncing
        });

        // Get current sync status from database
        const dbLabel = await this.labelSyncRepo.findByUserIdAndLabelId(
          user.id,
          gmailLabel.id
        );

        labels.push({
          id: gmailLabel.id,
          name: gmailLabel.name,
          type: labelType,
          isSyncing: dbLabel ? dbLabel.isSyncing : false,
          messageListVisibility: gmailLabel.messageListVisibility,
          labelListVisibility: gmailLabel.labelListVisibility
        });
      }

      return labels;
    } catch (error) {
      logger.error(`Error syncing labels for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Get user's labels with sync status
   */
  async getUserLabels(user) {
    // First, try to get from database
    const dbLabels = await this.labelSyncRepo.findByUserId(user.id);

    if (dbLabels.length > 0) {
      // Return labels from database
      return dbLabels.map(label => ({
        id: label.labelId,
        name: label.labelName,
        type: label.labelType,
        isSyncing: label.isSyncing,
        lastSyncedAt: label.lastSyncedAt
      }));
    }

    // If no labels in database, fetch from Gmail and sync
    return await this.syncUserLabels(user);
  }

  /**
   * Update which labels user wants to sync
   */
  async updateSyncSettings(user, labelIds, isSyncing) {
    await this.labelSyncRepo.updateSyncStatus(user.id, labelIds, isSyncing);
    return { success: true };
  }

  /**
   * Auto-enable sync for all user-created labels (smart CRM feature)
   * This automatically syncs labels that match customer names
   */
  async autoEnableUserLabels(user) {
    try {
      const allLabels = await this.getUserLabels(user);
      const userLabels = allLabels.filter(label => label.type === 'user');
      const labelIds = userLabels.map(label => label.id);
      
      if (labelIds.length > 0) {
        await this.updateSyncSettings(user, labelIds, true);
        logger.info(`Auto-enabled sync for ${labelIds.length} user labels for user ${user.id}`);
      }
      
      return userLabels;
    } catch (error) {
      logger.error(`Error auto-enabling user labels:`, error);
      throw error;
    }
  }

  /**
   * Get labels that user has selected to sync
   */
  async getSyncingLabels(user) {
    const labels = await this.labelSyncRepo.getSyncingLabels(user.id);
    return labels.map(label => ({
      id: label.labelId,
      name: label.labelName,
      type: label.labelType
    }));
  }

  /**
   * Determine if label is system label or user-created
   */
  determineLabelType(labelId) {
    const systemLabels = [
      'INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'UNREAD', 'STARRED',
      'IMPORTANT', 'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 
      'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'
    ];

    return systemLabels.includes(labelId) ? 'system' : 'user';
  }
}

module.exports = GmailLabelService;

