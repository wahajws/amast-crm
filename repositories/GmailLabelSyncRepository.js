const BaseRepository = require('../base/BaseRepository');
const GmailLabelSync = require('../models/GmailLabelSync');
const { getTableName } = require('../utils/modelRegistry');

class GmailLabelSyncRepository extends BaseRepository {
  constructor() {
    super(GmailLabelSync);
  }

  async findByUserId(userId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY label_name`;
    const results = await this.query(sql, [userId]);
    return results.map(row => GmailLabelSync.fromDatabaseRow(row));
  }

  async findByUserIdAndLabelId(userId, labelId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND label_id = ? LIMIT 1`;
    const results = await this.query(sql, [userId, labelId]);
    return results.length > 0 ? GmailLabelSync.fromDatabaseRow(results[0]) : null;
  }

  async upsertLabelSync(userId, labelData) {
    const { labelId, labelName, labelType, isSyncing } = labelData;
    
    const existing = await this.findByUserIdAndLabelId(userId, labelId);
    
    if (existing) {
      // Update existing
      const sql = `UPDATE ${this.tableName} 
                   SET label_name = ?, label_type = ?, is_syncing = ?, updated_at = NOW()
                   WHERE user_id = ? AND label_id = ?`;
      await this.query(sql, [labelName, labelType, isSyncing, userId, labelId]);
      return existing.id;
    } else {
      // Insert new
      const sql = `INSERT INTO ${this.tableName} 
                   (user_id, label_id, label_name, label_type, is_syncing) 
                   VALUES (?, ?, ?, ?, ?)`;
      const result = await this.query(sql, [userId, labelId, labelName, labelType, isSyncing]);
      return result.insertId;
    }
  }

  async updateSyncStatus(userId, labelIds, isSyncing) {
    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return;
    }
    const placeholders = labelIds.map(() => '?').join(',');
    const sql = `UPDATE ${this.tableName} 
                 SET is_syncing = ?, updated_at = NOW()
                 WHERE user_id = ? AND label_id IN (${placeholders})`;
    await this.query(sql, [isSyncing, userId, ...labelIds]);
  }

  async getSyncingLabels(userId) {
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE user_id = ? AND is_syncing = TRUE 
                 ORDER BY label_name`;
    const results = await this.query(sql, [userId]);
    return results.map(row => GmailLabelSync.fromDatabaseRow(row));
  }

  async updateLastSyncedAt(userId, labelId) {
    const sql = `UPDATE ${this.tableName} 
                 SET last_synced_at = NOW(), updated_at = NOW()
                 WHERE user_id = ? AND label_id = ?`;
    await this.query(sql, [userId, labelId]);
  }
}

module.exports = GmailLabelSyncRepository;







