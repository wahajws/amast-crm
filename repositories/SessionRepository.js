const BaseRepository = require('../base/BaseRepository');

// Create a simple model-like object for SessionRepository
const SessionModel = {
  getTableName: () => 'user_sessions',
  fromDatabaseRow: (row) => row,
  getFillableFields: () => ['user_id', 'token', 'refresh_token', 'expires_at', 'ip_address', 'user_agent']
};

class SessionRepository extends BaseRepository {
  constructor() {
    super(SessionModel);
  }

  async create(data) {
    const sql = `INSERT INTO user_sessions 
                 (user_id, token, refresh_token, expires_at, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    await this.query(sql, [
      data.userId,
      data.token,
      data.refreshToken,
      data.expiresAt,
      data.ipAddress || null,
      data.userAgent || null
    ]);
    return true;
  }

  async findByToken(token) {
    const sql = `SELECT * FROM user_sessions 
                 WHERE token = ? AND is_active = TRUE AND expires_at > NOW() 
                 LIMIT 1`;
    const results = await this.query(sql, [token]);
    return results.length > 0 ? results[0] : null;
  }

  async deactivateByToken(token) {
    const sql = `UPDATE user_sessions SET is_active = FALSE WHERE token = ?`;
    await this.query(sql, [token]);
    return true;
  }

  async updateRefreshToken(oldRefreshToken, newAccessToken, newRefreshToken) {
    const sql = `UPDATE user_sessions 
                 SET token = ?, refresh_token = ?, last_activity = NOW() 
                 WHERE refresh_token = ? AND is_active = TRUE`;
    await this.query(sql, [newAccessToken, newRefreshToken, oldRefreshToken]);
    return true;
  }
}

module.exports = SessionRepository;

