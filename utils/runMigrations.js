require('dotenv').config();
const database = require('../config/database');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

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
      const sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Running migration: ${file}`);
      await database.query(sql);
      logger.info(`✓ Completed: ${file}`);
    }

    logger.info('All migrations completed successfully!');
    await database.close();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

