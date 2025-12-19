const BaseRepository = require('../base/BaseRepository');
const database = require('../config/database');
const { logger } = require('../utils/logger');

class PasswordResetTokenRepository {
  constructor() {
    this.tableName = 'password_reset_tokens';
  }

  async query(sql, params = []) {
    return await database.query(sql, params);
  }

  /**
   * Create a new password reset token
   */
  async create(userId, token, expiresAt) {
    const sql = `INSERT INTO ${this.tableName} (user_id, token, expires_at) 
                 VALUES (?, ?, ?)`;
    await this.query(sql, [userId, token, expiresAt]);
    return true;
  }

  /**
   * Find token by token string
   */
  async findByToken(token) {
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE token = ? AND expires_at > NOW() AND used_at IS NULL 
                 LIMIT 1`;
    const results = await this.query(sql, [token]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Mark token as used
   */
  async markAsUsed(token) {
    const sql = `UPDATE ${this.tableName} SET used_at = NOW() WHERE token = ?`;
    await this.query(sql, [token]);
    return true;
  }

  /**
   * Delete expired tokens
   */
  async deleteExpired() {
    const sql = `DELETE FROM ${this.tableName} WHERE expires_at < NOW()`;
    await this.query(sql);
    return true;
  }

  /**
   * Delete all tokens for a user
   */
  async deleteByUserId(userId) {
    const sql = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    await this.query(sql, [userId]);
    return true;
  }
}

module.exports = PasswordResetTokenRepository;







