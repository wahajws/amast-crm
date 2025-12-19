const BaseModel = require('../base/BaseModel');

class GmailLabelSync extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.userId = data.user_id || data.userId || null;
    this.labelId = data.label_id || data.labelId || null;
    this.labelName = data.label_name || data.labelName || null;
    this.labelType = data.label_type || data.labelType || 'user';
    this.isSyncing = data.is_syncing !== undefined ? data.is_syncing : (data.isSyncing !== undefined ? data.isSyncing : false);
    this.lastSyncedAt = data.last_synced_at || data.lastSyncedAt || null;
  }

  static getTableName() {
    return 'gmail_label_sync_settings';
  }

  static getFillableFields() {
    return [
      'user_id',
      'label_id',
      'label_name',
      'label_type',
      'is_syncing',
      'last_synced_at'
    ];
  }

  validate() {
    const errors = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }
    if (!this.labelId) {
      errors.push('Label ID is required');
    }
    if (!this.labelName) {
      errors.push('Label name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = GmailLabelSync;







