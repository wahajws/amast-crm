const BaseRepository = require('../base/BaseRepository');
const Role = require('../models/Role');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  // Override findOne because roles table doesn't have deleted_at
  async findOne(where, params = []) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${where} LIMIT 1`;
    const results = await this.query(sql, params);
    return results.length > 0 ? this.model.fromDatabaseRow(results[0]) : null;
  }

  // Override findAll because roles table doesn't have deleted_at
  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 1000, // Large default for roles (usually not many)
      orderBy = 'created_at',
      order = 'DESC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    const whereClause = where ? `WHERE ${where}` : '';
    
    // Convert to integers for LIMIT/OFFSET (MySQL doesn't support placeholders)
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const dataSql = `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${orderBy} ${order} LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [countResult] = await this.query(countSql, params);
    const total = countResult.total || 0;

    const data = await this.query(dataSql, params);
    
    return {
      data: this.model.fromDatabaseRows(data),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

module.exports = RoleRepository;

