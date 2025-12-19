require('dotenv').config();
const database = require('../config/database');
const { logger } = require('./logger');

async function checkColumnExists(tableName, columnName) {
  try {
    const sql = `SELECT COUNT(*) as count 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = ? 
                 AND COLUMN_NAME = ?`;
    const results = await database.query(sql, [tableName, columnName]);
    return results[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function addColumnIfMissing(tableName, columnName, columnDef) {
  const exists = await checkColumnExists(tableName, columnName);
  if (!exists) {
    try {
      await database.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
      logger.info(`✓ Added column: ${tableName}.${columnName}`);
      return true;
    } catch (error) {
      logger.error(`✗ Failed to add column ${tableName}.${columnName}: ${error.message}`);
      return false;
    }
  } else {
    logger.info(`- Column already exists: ${tableName}.${columnName}`);
    return false;
  }
}

async function fixMissingColumns() {
  try {
    await database.connect();
    logger.info('Checking for missing columns in users table...');

    const columns = [
      { name: 'registration_token', def: "VARCHAR(255) NULL DEFAULT NULL COMMENT 'Token for email verification'" },
      { name: 'registration_token_expires_at', def: "TIMESTAMP NULL DEFAULT NULL COMMENT 'Registration token expiration'" },
      { name: 'email_verified_at', def: "TIMESTAMP NULL DEFAULT NULL COMMENT 'Email verification timestamp'" },
      { name: 'approved_at', def: "TIMESTAMP NULL DEFAULT NULL COMMENT 'Admin approval timestamp'" },
      { name: 'approved_by', def: "INT NULL DEFAULT NULL COMMENT 'Admin who approved the user'" },
      { name: 'failed_login_attempts', def: "INT DEFAULT 0 COMMENT 'Number of failed login attempts'" },
      { name: 'locked_until', def: "TIMESTAMP NULL DEFAULT NULL COMMENT 'Account lock expiration time'" },
      { name: 'must_change_password', def: "BOOLEAN DEFAULT FALSE COMMENT 'Force password change on next login'" }
    ];

    let added = 0;
    for (const column of columns) {
      const wasAdded = await addColumnIfMissing('users', column.name, column.def);
      if (wasAdded) added++;
    }

    logger.info(`\n✓ Fix complete! Added ${added} missing column(s).`);
    await database.close();
    process.exit(0);
  } catch (error) {
    logger.error('Fix failed:', error);
    await database.close();
    process.exit(1);
  }
}

fixMissingColumns();

