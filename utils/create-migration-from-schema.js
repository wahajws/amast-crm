require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

function createMigrationFromSchema() {
  try {
    const schemaFile = path.join(__dirname, '..', 'database_schema.txt');
    const outputFile = path.join(__dirname, '..', 'migrations', '999_create_all_missing_tables.sql');

    console.log('==========================================');
    console.log('Create Migration Script from Schema');
    console.log('==========================================');
    console.log('');

    if (!fs.existsSync(schemaFile)) {
      console.error('✗ Schema file not found:', schemaFile);
      console.error('  Please run node utils/export-schema.js first');
      process.exit(1);
    }

    console.log(`Reading schema from: ${schemaFile}`);
    console.log(`Creating migration: ${outputFile}`);
    console.log('');

    // Read schema file
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');

    // Extract CREATE TABLE statements (handles multi-line)
    const createTableRegex = /CREATE TABLE IF NOT EXISTS[^;]+;/gs;
    const matches = schemaContent.match(createTableRegex) || [];

    if (matches.length === 0) {
      console.error('✗ No CREATE TABLE statements found in schema file');
      process.exit(1);
    }

    console.log(`Found ${matches.length} tables`);
    console.log('');

    // Create migration file content
    let migrationContent = `-- ============================================\n`;
    migrationContent += `-- Create All Missing Tables\n`;
    migrationContent += `-- Generated from localhost schema export\n`;
    migrationContent += `-- Run this on server to create all missing tables\n`;
    migrationContent += `-- Generated: ${new Date().toISOString()}\n`;
    migrationContent += `-- ============================================\n\n`;

    // Extract table names and add them
    const tableNames = [];
    for (const match of matches) {
      const tableMatch = match.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        tableNames.push(tableName);
        console.log(`  - ${tableName}`);
        
        // Extract comment if exists
        const commentMatch = match.match(/COMMENT='([^']+)'/);
        const comment = commentMatch ? commentMatch[1] : '';
        
        migrationContent += `-- Table: ${tableName}${comment ? ` (${comment})` : ''}\n`;
        migrationContent += `${match}\n\n`;
      }
    }

    // Add ALTER TABLE statements for columns that might be missing
    migrationContent += `-- ============================================\n`;
    migrationContent += `-- Add missing columns to existing tables\n`;
    migrationContent += `-- ============================================\n\n`;

    // Add email template columns to contacts
    migrationContent += `-- Add email template columns to contacts (if missing)\n`;
    migrationContent += `SET @col_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.COLUMNS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'contacts' \n`;
    migrationContent += `  AND COLUMN_NAME = 'email_template'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@col_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE contacts ADD COLUMN email_template TEXT DEFAULT NULL COMMENT ''Generated email template for this contact''',\n`;
    migrationContent += `  'SELECT ''Column email_template already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    migrationContent += `SET @col_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.COLUMNS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'contacts' \n`;
    migrationContent += `  AND COLUMN_NAME = 'email_subject'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@col_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE contacts ADD COLUMN email_subject VARCHAR(255) DEFAULT NULL COMMENT ''Generated email subject for this contact''',\n`;
    migrationContent += `  'SELECT ''Column email_subject already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    migrationContent += `SET @col_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.COLUMNS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'contacts' \n`;
    migrationContent += `  AND COLUMN_NAME = 'email_generated_at'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@col_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE contacts ADD COLUMN email_generated_at TIMESTAMP NULL DEFAULT NULL COMMENT ''Timestamp when email was generated''',\n`;
    migrationContent += `  'SELECT ''Column email_generated_at already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    // Add reminder fields to notes
    migrationContent += `-- Add reminder fields to notes (if missing)\n`;
    migrationContent += `SET @col_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.COLUMNS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'notes' \n`;
    migrationContent += `  AND COLUMN_NAME = 'reminder_date'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@col_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE notes ADD COLUMN reminder_date DATETIME NULL DEFAULT NULL COMMENT ''Reminder date and time for this note''',\n`;
    migrationContent += `  'SELECT ''Column reminder_date already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    migrationContent += `SET @col_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.COLUMNS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'notes' \n`;
    migrationContent += `  AND COLUMN_NAME = 'reminder_status'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@col_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE notes ADD COLUMN reminder_status ENUM(''PENDING'', ''COMPLETED'', ''CANCELLED'') DEFAULT NULL COMMENT ''Reminder status''',\n`;
    migrationContent += `  'SELECT ''Column reminder_status already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    migrationContent += `SET @col_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.COLUMNS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'notes' \n`;
    migrationContent += `  AND COLUMN_NAME = 'reminder_completed_at'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@col_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE notes ADD COLUMN reminder_completed_at TIMESTAMP NULL DEFAULT NULL COMMENT ''When the reminder was marked as completed''',\n`;
    migrationContent += `  'SELECT ''Column reminder_completed_at already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    // Add indexes for reminder fields
    migrationContent += `-- Add indexes for reminder fields\n`;
    migrationContent += `SET @idx_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.STATISTICS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'notes' \n`;
    migrationContent += `  AND INDEX_NAME = 'idx_reminder_date'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@idx_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE notes ADD INDEX idx_reminder_date (reminder_date)',\n`;
    migrationContent += `  'SELECT ''Index idx_reminder_date already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    migrationContent += `SET @idx_exists = (\n`;
    migrationContent += `  SELECT COUNT(*) \n`;
    migrationContent += `  FROM INFORMATION_SCHEMA.STATISTICS \n`;
    migrationContent += `  WHERE TABLE_SCHEMA = DATABASE() \n`;
    migrationContent += `  AND TABLE_NAME = 'notes' \n`;
    migrationContent += `  AND INDEX_NAME = 'idx_reminder_status'\n`;
    migrationContent += `);\n\n`;
    migrationContent += `SET @sql = IF(@idx_exists = 0,\n`;
    migrationContent += `  'ALTER TABLE notes ADD INDEX idx_reminder_status (reminder_status)',\n`;
    migrationContent += `  'SELECT ''Index idx_reminder_status already exists'' AS message'\n`;
    migrationContent += `);\n`;
    migrationContent += `PREPARE stmt FROM @sql;\n`;
    migrationContent += `EXECUTE stmt;\n`;
    migrationContent += `DEALLOCATE PREPARE stmt;\n\n`;

    migrationContent += `-- ============================================\n`;
    migrationContent += `-- Success message\n`;
    migrationContent += `-- ============================================\n`;
    migrationContent += `SELECT 'All missing tables and columns have been created successfully!' AS message;\n\n`;

    // Ensure migrations directory exists
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Write migration file
    fs.writeFileSync(outputFile, migrationContent, 'utf8');

    console.log('');
    console.log('✓ Migration script created successfully!');
    console.log('');
    console.log(`File: ${outputFile}`);
    console.log(`Tables included: ${tableNames.length}`);
    console.log('');
    console.log('To apply on server:');
    console.log(`  mysql -u root -p crm_system < ${outputFile}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    logger.error('Failed to create migration:', error);
    process.exit(1);
  }
}

createMigrationFromSchema();

