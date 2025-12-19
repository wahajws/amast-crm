/**
 * Field Mapper Utility
 * Handles conversion between camelCase (API/Model) and snake_case (Database)
 */

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Map object keys from camelCase to snake_case
 */
function mapToSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const mapped = {};
  Object.keys(obj).forEach(key => {
    let value = obj[key];
    
    // Convert empty strings to null for better database handling
    if (value === '') {
      value = null;
    }
    
    // If key is already snake_case, use it as is
    if (key.includes('_')) {
      mapped[key] = value;
    } else {
      // Convert camelCase to snake_case
      mapped[toSnakeCase(key)] = value;
    }
  });
  return mapped;
}

/**
 * Sanitize data for database insertion
 * Converts empty strings to null and handles type conversions
 */
function sanitizeForDatabase(data, fillableFields = []) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Fields that should be integers (foreign keys, IDs, etc.)
  const integerFields = [
    'id', 'account_id', 'contact_id', 'opportunity_id', 'owner_id',
    'created_by', 'updated_by', 'role_id', 'user_id', 'probability',
    'number_of_employees', 'annual_revenue', 'sent_by'
  ];
  
  // Fields that should be decimals/floats
  const decimalFields = ['amount', 'annual_revenue'];
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    
    // Convert empty strings to null
    if (value === '') {
      sanitized[key] = null;
    }
    // Convert string numbers to actual numbers for integer fields
    else if (integerFields.includes(key) && typeof value === 'string' && value !== null) {
      const numValue = parseInt(value, 10);
      sanitized[key] = isNaN(numValue) ? null : numValue;
    }
    // Convert string numbers to actual numbers for decimal fields
    else if (decimalFields.includes(key) && typeof value === 'string' && value !== null) {
      const numValue = parseFloat(value);
      sanitized[key] = isNaN(numValue) ? null : numValue;
    }
  });
  
  return sanitized;
}

/**
 * Map object keys from snake_case to camelCase
 */
function mapToCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const mapped = {};
  Object.keys(obj).forEach(key => {
    mapped[toCamelCase(key)] = obj[key];
  });
  return mapped;
}

/**
 * Get table name from model class
 */
function getTableName(Model) {
  if (typeof Model.getTableName === 'function') {
    return Model.getTableName();
  }
  throw new Error(`Model ${Model.name} must implement getTableName() static method`);
}

/**
 * Get foreign key column name for a relationship
 * @param {string} modelName - The related model name (e.g., 'Account', 'Contact')
 * @returns {string} - The foreign key column name (e.g., 'account_id', 'contact_id')
 */
function getForeignKeyColumn(modelName) {
  // Convert model name to snake_case and add _id suffix
  const snakeCase = toSnakeCase(modelName);
  return `${snakeCase}_id`;
}

/**
 * Get primary key column name (default is 'id')
 */
function getPrimaryKeyColumn() {
  return 'id';
}

/**
 * Get soft delete column name
 */
function getSoftDeleteColumn() {
  return 'deleted_at';
}

/**
 * Get created at column name
 */
function getCreatedAtColumn() {
  return 'created_at';
}

/**
 * Get updated at column name
 */
function getUpdatedAtColumn() {
  return 'updated_at';
}

/**
 * Get owner column name
 */
function getOwnerColumn() {
  return 'owner_id';
}

/**
 * Get created by column name
 */
function getCreatedByColumn() {
  return 'created_by';
}

/**
 * Get updated by column name
 */
function getUpdatedByColumn() {
  return 'updated_by';
}

module.exports = {
  toSnakeCase,
  toCamelCase,
  mapToSnakeCase,
  mapToCamelCase,
  sanitizeForDatabase,
  getTableName,
  getForeignKeyColumn,
  getPrimaryKeyColumn,
  getSoftDeleteColumn,
  getCreatedAtColumn,
  getUpdatedAtColumn,
  getOwnerColumn,
  getCreatedByColumn,
  getUpdatedByColumn
};

