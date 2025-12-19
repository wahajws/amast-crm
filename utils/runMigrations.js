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
      let sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Running migration: ${file}`);
      
      // Split SQL by semicolons and execute each statement separately
      // This handles files with multiple ALTER TABLE statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => {
          // Filter out empty statements and comments
          const trimmed = s.trim();
          return trimmed.length > 0 && 
                 !trimmed.startsWith('--') && 
                 !trimmed.match(/^\/\*/); // Not a multi-line comment start
        });
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await database.query(statement + ';');
          } catch (error) {
            // If error is about duplicate column/index/constraint, it's okay (already applied)
            if (error.message.includes('Duplicate column') || 
                error.message.includes('Duplicate key') ||
                error.message.includes('already exists') ||
                error.message.includes('Duplicate column name') ||
                error.message.includes('Duplicate key name')) {
              logger.warn(`  ⚠ Statement skipped (already applied): ${error.message.split('\n')[0]}`);
            } else {
              // Re-throw other errors
              throw error;
            }
          }
        }
      }
      
      logger.info(`✓ Completed: ${file}`);
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

