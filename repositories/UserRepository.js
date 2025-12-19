const BaseRepository = require('../base/BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    const sql = `SELECT u.*, r.name as role_name, r.display_name as role_display_name
                 FROM ${this.tableName} u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.email = ? AND u.deleted_at IS NULL 
                 LIMIT 1`;
    const results = await this.query(sql, [email]);
    if (results.length > 0) {
      const user = User.fromDatabaseRow(results[0]);
      if (results[0].role_name) {
        user.role = {
          id: user.roleId,
          name: results[0].role_name,
          displayName: results[0].role_display_name
        };
      }
      return user;
    }
    return null;
  }

  async findById(id) {
    const sql = `SELECT u.*, r.name as role_name, r.display_name as role_display_name
                 FROM ${this.tableName} u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ? AND u.deleted_at IS NULL 
                 LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const user = User.fromDatabaseRow(results[0]);
      if (results[0].role_name) {
        user.role = {
          id: user.roleId,
          name: results[0].role_name,
          displayName: results[0].role_display_name
        };
      }
      return user;
    }
    return null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'u.created_at',
      order = 'DESC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    
    // Build WHERE clause - ensure we always have deleted_at check
    let whereClause = 'WHERE u.deleted_at IS NULL';
    let whereParams = [];
    
    if (where && where.trim() !== '') {
      whereClause = `WHERE ${where} AND u.deleted_at IS NULL`;
      whereParams = Array.isArray(params) ? [...params] : [];
    }
    
    // Count query - only uses where params
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} u ${whereClause}`;
    const [countResult] = await this.query(countSql, whereParams);
    const total = countResult.total || 0;

    // Data query - uses where params + LIMIT/OFFSET params
    // MySQL doesn't support placeholders for LIMIT/OFFSET in prepared statements
    // So we use direct values (safe because they're already integers)
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    // Sanitize to prevent SQL injection (they should already be numbers)
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const dataSql = `SELECT u.*, r.name as role_name, r.display_name as role_display_name
                     FROM ${this.tableName} u 
                     LEFT JOIN roles r ON u.role_id = r.id 
                     ${whereClause} 
                     ORDER BY ${orderBy} ${order} 
                     LIMIT ${limitValue} OFFSET ${offsetValue}`;
    
    const data = await this.query(dataSql, whereParams);
    
    // Convert rows to models with role info
    const users = data.map(row => {
      const user = User.fromDatabaseRow(row);
      if (row.role_name) {
        user.role = {
          id: user.roleId,
          name: row.role_name,
          displayName: row.role_display_name
        };
      }
      return user;
    });
    
    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async updateLastLogin(userId) {
    const sql = `UPDATE ${this.tableName} SET last_login = NOW() WHERE id = ?`;
    await this.query(sql, [userId]);
  }
}

module.exports = UserRepository;
