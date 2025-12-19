const BaseModel = require('../base/BaseModel');

class EmailSyncLog extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.userId = data.user_id || data.userId || null;
    this.labelId = data.label_id || data.labelId || null;
    this.syncType = data.sync_type || data.syncType || 'manual';
    this.status = data.status || 'success';
    this.emailsSynced = data.emails_synced || data.emailsSynced || 0;
    this.emailsSkipped = data.emails_skipped || data.emailsSkipped || 0;
    this.errorMessage = data.error_message || data.errorMessage || null;
    this.startedAt = data.started_at || data.startedAt || null;
    this.completedAt = data.completed_at || data.completedAt || null;
  }

  static getTableName() {
    return 'email_sync_logs';
  }

  static getFillableFields() {
    return [
      'user_id',
      'label_id',
      'sync_type',
      'status',
      'emails_synced',
      'emails_skipped',
      'error_message',
      'started_at',
      'completed_at'
    ];
  }
}

module.exports = EmailSyncLog;







