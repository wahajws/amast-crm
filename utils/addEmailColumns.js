require('dotenv').config();
const database = require('../config/database');
const { logger } = require('./logger');

async function addEmailColumns() {
  try {
    await database.connect();
    logger.info('Adding email columns to contacts table...');

    // Check if columns exist and add them if they don't
    const checkColumn = async (columnName, columnDef) => {
      try {
        const rows = await database.query(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'contacts' 
           AND COLUMN_NAME = ?`,
          [columnName]
        );
        
        const count = rows[0]?.count || 0;
        
        if (count === 0) {
          await database.query(`ALTER TABLE contacts ADD COLUMN ${columnDef}`);
          logger.info(`✓ Added column: ${columnName}`);
        } else {
          logger.info(`✓ Column already exists: ${columnName}`);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.errno === 1060) {
          logger.info(`✓ Column already exists: ${columnName}`);
        } else {
          // Try to add anyway - might work if check failed
          try {
            await database.query(`ALTER TABLE contacts ADD COLUMN ${columnDef}`);
            logger.info(`✓ Added column: ${columnName}`);
          } catch (addError) {
            if (addError.code === 'ER_DUP_FIELDNAME' || addError.errno === 1060) {
              logger.info(`✓ Column already exists: ${columnName}`);
            } else {
              throw addError;
            }
          }
        }
      }
    };

    await checkColumn('email_template', 'email_template TEXT DEFAULT NULL COMMENT \'Generated email template for this contact\'');
    await checkColumn('email_subject', 'email_subject VARCHAR(255) DEFAULT NULL COMMENT \'Generated email subject for this contact\'');
    await checkColumn('email_generated_at', 'email_generated_at TIMESTAMP NULL DEFAULT NULL COMMENT \'Timestamp when email was generated\'');

    logger.info('All email columns added successfully!');
    await database.close();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to add email columns:', error);
    process.exit(1);
  }
}

addEmailColumns();

