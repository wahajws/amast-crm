const database = require('../config/database');

/**
 * Base Repository Class
 * All repositories should extend this class
 */
class BaseRepository {
  constructor(model) {
    if (!model) {
      throw new Error('Model is required for repository');
    }
    this.model = model;
    this.tableName = model.getTableName();
  }

  /**
   * Get database connection
   */
  getConnection() {
    return database.getPool();
  }

  /**
   * Execute query
   */
  async query(sql, params = []) {
    return await database.query(sql, params);
  }

  /**
   * Find by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? this.model.fromDatabaseRow(results[0]) : null;
  }

  /**
   * Find all with pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'created_at',
      order = 'DESC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    const whereClause = where ? `WHERE ${where} AND deleted_at IS NULL` : 'WHERE deleted_at IS NULL';
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const dataSql = `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;

    const [countResult] = await this.query(countSql, params);
    const total = countResult.total;

    const data = await this.query(dataSql, [...params, pageSize, offset]);
    
    return {
      data: this.model.fromDatabaseRows(data),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Find one by condition
   */
  async findOne(where, params = []) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${where} AND deleted_at IS NULL LIMIT 1`;
    const results = await this.query(sql, params);
    return results.length > 0 ? this.model.fromDatabaseRow(results[0]) : null;
  }

  /**
   * Create new record
   */
  async create(data) {
    const { sanitizeForDatabase } = require('../utils/fieldMapper');
    const fillable = this.model.getFillableFields();
    
    // Sanitize data: convert empty strings to null, handle type conversions
    const sanitizedData = sanitizeForDatabase(data, fillable);
    
    // Fields that should be integers (foreign keys, IDs, etc.)
    const integerFields = [
      'id', 'account_id', 'contact_id', 'opportunity_id', 'owner_id',
      'created_by', 'updated_by', 'role_id', 'user_id', 'probability',
      'number_of_employees'
    ];
    
    const fields = [];
    const values = [];
    const placeholders = [];

    fillable.forEach(field => {
      if (sanitizedData.hasOwnProperty(field)) {
        let value = sanitizedData[field];
        
        // Convert empty strings to null for integer fields
        if (integerFields.includes(field)) {
          if (value === '' || value === null || value === undefined) {
            value = null;
          } else if (typeof value === 'string') {
            const numValue = parseInt(value, 10);
            value = isNaN(numValue) ? null : numValue;
          }
        } else {
          // For non-integer fields, convert empty strings to null
          if (value === '') {
            value = null;
          }
        }
        
        // Only include field if value is not undefined
        // NULL values are allowed for optional fields
        if (value !== undefined) {
          fields.push(field);
          values.push(value);
          placeholders.push('?');
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to insert');
    }

    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const result = await this.query(sql, values);
    
    return await this.findById(result.insertId);
  }

  /**
   * Update record
   */
  async update(id, data) {
    const { sanitizeForDatabase } = require('../utils/fieldMapper');
    const fillable = this.model.getFillableFields();
    
    // Sanitize data: convert empty strings to null, handle type conversions
    const sanitizedData = sanitizeForDatabase(data, fillable);
    
    // Fields that should be integers (foreign keys, IDs, etc.)
    const integerFields = [
      'id', 'account_id', 'contact_id', 'opportunity_id', 'owner_id',
      'created_by', 'updated_by', 'role_id', 'user_id', 'probability',
      'number_of_employees'
    ];
    
    const updates = [];
    const values = [];

    fillable.forEach(field => {
      if (sanitizedData.hasOwnProperty(field) && field !== 'id') {
        let value = sanitizedData[field];
        
        // Convert empty strings to null for integer fields
        if (integerFields.includes(field)) {
          if (value === '' || value === null || value === undefined) {
            value = null;
          } else if (typeof value === 'string') {
            const numValue = parseInt(value, 10);
            value = isNaN(numValue) ? null : numValue;
          }
        } else {
          // For non-integer fields, convert empty strings to null
          if (value === '') {
            value = null;
          }
        }
        
        // Only include field if value is not undefined
        // NULL values are allowed for optional fields
        if (value !== undefined) {
          updates.push(`${field} = ?`);
          values.push(value);
        }
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
    await this.query(sql, values);
    
    return await this.findById(id);
  }

  /**
   * Delete record (soft delete)
   */
  async delete(id) {
    const sql = `UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = ?`;
    await this.query(sql, [id]);
    return true;
  }

  /**
   * Hard delete record
   */
  async hardDelete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.query(sql, [id]);
    return true;
  }

  /**
   * Check if record exists
   */
  async exists(id) {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`;
    const results = await this.query(sql, [id]);
    return results[0].count > 0;
  }

  /**
   * Count records
   */
  async count(where = '', params = []) {
    const whereClause = where ? `WHERE ${where} AND deleted_at IS NULL` : 'WHERE deleted_at IS NULL';
    const sql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const results = await this.query(sql, params);
    return results[0].total;
  }
}

module.exports = BaseRepository;

