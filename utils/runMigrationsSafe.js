require('dotenv').config();
const database = require('../config/database');
const fs = require('fs');
const path = require('path');
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

async function checkIndexExists(tableName, indexName) {
  try {
    const sql = `SELECT COUNT(*) as count 
                 FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = ? 
                 AND INDEX_NAME = ?`;
    const results = await database.query(sql, [tableName, indexName]);
    return results[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function checkConstraintExists(tableName, constraintName) {
  try {
    const sql = `SELECT COUNT(*) as count 
                 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = ? 
                 AND CONSTRAINT_NAME = ?`;
    const results = await database.query(sql, [tableName, constraintName]);
    return results[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function runMigrations() {
  try {
    await database.connect();
    logger.info('Starting database migrations...');

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      let sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Running migration: ${file}`);
      
      // Special handling for migration 014 (user approval fields)
      if (file === '014_add_user_approval_fields.sql') {
        // Check each column before adding
        const columns = [
          { name: 'registration_token', sql: "ALTER TABLE users ADD COLUMN registration_token VARCHAR(255) NULL DEFAULT NULL COMMENT 'Token for email verification'" },
          { name: 'registration_token_expires_at', sql: "ALTER TABLE users ADD COLUMN registration_token_expires_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Registration token expiration'" },
          { name: 'email_verified_at', sql: "ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Email verification timestamp'" },
          { name: 'approved_at', sql: "ALTER TABLE users ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Admin approval timestamp'" },
          { name: 'approved_by', sql: "ALTER TABLE users ADD COLUMN approved_by INT NULL DEFAULT NULL COMMENT 'Admin who approved the user'" },
          { name: 'failed_login_attempts', sql: "ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0 COMMENT 'Number of failed login attempts'" },
          { name: 'locked_until', sql: "ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL DEFAULT NULL COMMENT 'Account lock expiration time'" },
          { name: 'must_change_password', sql: "ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE COMMENT 'Force password change on next login'" }
        ];

        for (const column of columns) {
          const exists = await checkColumnExists('users', column.name);
          if (!exists) {
            await database.query(column.sql);
            logger.info(`  ✓ Added column: ${column.name}`);
          } else {
            logger.info(`  - Column already exists: ${column.name}`);
          }
        }

        // Add indexes
        const indexes = [
          { name: 'idx_registration_token', sql: 'ALTER TABLE users ADD INDEX idx_registration_token (registration_token)' },
          { name: 'idx_email_verified_at', sql: 'ALTER TABLE users ADD INDEX idx_email_verified_at (email_verified_at)' },
          { name: 'idx_approved_at', sql: 'ALTER TABLE users ADD INDEX idx_approved_at (approved_at)' },
          { name: 'idx_locked_until', sql: 'ALTER TABLE users ADD INDEX idx_locked_until (locked_until)' }
        ];

        for (const index of indexes) {
          const exists = await checkIndexExists('users', index.name);
          if (!exists) {
            await database.query(index.sql);
            logger.info(`  ✓ Added index: ${index.name}`);
          } else {
            logger.info(`  - Index already exists: ${index.name}`);
          }
        }

        // Add foreign key
        const fkExists = await checkConstraintExists('users', 'fk_users_approved_by');
        if (!fkExists) {
          await database.query('ALTER TABLE users ADD CONSTRAINT fk_users_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL');
          logger.info('  ✓ Added foreign key: fk_users_approved_by');
        } else {
          logger.info('  - Foreign key already exists: fk_users_approved_by');
        }
      } else {
        // For other migrations, run as-is
        try {
          await database.query(sql);
          logger.info(`✓ Completed: ${file}`);
        } catch (error) {
          // If error is about duplicate column/index, it's okay
          if (error.message.includes('Duplicate column') || 
              error.message.includes('Duplicate key') ||
              error.message.includes('already exists')) {
            logger.warn(`  ⚠ Migration ${file} skipped (already applied): ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }

    logger.info('All migrations completed successfully!');
    await database.close();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    await database.close();
    process.exit(1);
  }
}

runMigrations();







