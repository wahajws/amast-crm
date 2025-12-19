const BaseRepository = require('../base/BaseRepository');
const EmailSyncLog = require('../models/EmailSyncLog');

class EmailSyncLogRepository extends BaseRepository {
  constructor() {
    super(EmailSyncLog);
  }

  async createLog(logData) {
    const { userId, labelId, syncType, status, emailsSynced, emailsSkipped, errorMessage } = logData;
    const sql = `INSERT INTO ${this.tableName} 
                 (user_id, label_id, sync_type, status, emails_synced, emails_skipped, error_message, started_at, completed_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const result = await this.query(sql, [userId, labelId, syncType, status, emailsSynced, emailsSkipped, errorMessage]);
    return result.insertId;
  }

  async findByUserId(userId, limit = 50) {
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE user_id = ? 
                 ORDER BY started_at DESC 
                 LIMIT ?`;
    const results = await this.query(sql, [userId, limit]);
    return results;
  }

  async getLatestSync(userId, labelId = null) {
    let sql = `SELECT * FROM ${this.tableName} 
               WHERE user_id = ? AND status = 'success'`;
    const params = [userId];
    
    if (labelId) {
      sql += ' AND label_id = ?';
      params.push(labelId);
    }
    
    sql += ' ORDER BY completed_at DESC LIMIT 1';
    const results = await this.query(sql, params);
    return results.length > 0 ? results[0] : null;
  }
}

module.exports = EmailSyncLogRepository;

