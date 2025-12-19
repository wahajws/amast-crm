/**
 * Base Model Class
 * All models should extend this class
 */
class BaseModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  /**
   * Convert model to plain object
   */
  toJSON() {
    const obj = {};
    for (const key in this) {
      if (this.hasOwnProperty(key) && !key.startsWith('_')) {
        obj[key] = this[key];
      }
    }
    return obj;
  }

  /**
   * Convert database row to model instance
   */
  static fromDatabaseRow(row) {
    if (!row) return null;
    
    const instance = new this();
    Object.keys(row).forEach(key => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      instance[camelKey] = row[key];
    });
    return instance;
  }

  /**
   * Convert multiple database rows to model instances
   */
  static fromDatabaseRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => this.fromDatabaseRow(row));
  }

  /**
   * Validate model data
   * Override in child classes
   */
  validate() {
    return { isValid: true, errors: [] };
  }

  /**
   * Get table name
   * Override in child classes
   */
  static getTableName() {
    throw new Error('getTableName() must be implemented in child class');
  }

  /**
   * Get fillable fields
   * Override in child classes
   */
  static getFillableFields() {
    return [];
  }

  /**
   * Get hidden fields (not included in toJSON)
   * Override in child classes
   */
  static getHiddenFields() {
    return ['password', 'passwordHash', 'accessToken', 'refreshToken'];
  }
}

module.exports = BaseModel;







