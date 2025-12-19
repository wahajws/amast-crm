require('dotenv').config();
const database = require('../config/database');
const { logger } = require('./logger');
const fs = require('fs');
const path = require('path');

async function addEmailCampaignsTable() {
  try {
    await database.connect();
    logger.info('Creating email_campaigns table...');

    const migrationPath = path.join(__dirname, '..', 'migrations', '022_create_email_campaigns_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await database.query(sql);
    logger.info('✓ Email campaigns table created successfully!');
    
    await database.close();
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.errno === 1050) {
      logger.info('✓ Email campaigns table already exists');
      await database.close();
      process.exit(0);
    } else {
      logger.error('Failed to create email campaigns table:', error);
      await database.close();
      process.exit(1);
    }
  }
}

addEmailCampaignsTable();

