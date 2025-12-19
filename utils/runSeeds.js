require('dotenv').config();
const database = require('../config/database');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

async function runSeeds() {
  try {
    await database.connect();
    logger.info('Starting database seeds...');

    const seedsDir = path.join(__dirname, '..', 'seeds');
    const files = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Running seed: ${file}`);
      
      // Split SQL by semicolons and execute each statement separately
      // This handles files with multiple statements
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
            // Ignore errors for SELECT statements (they're just for display)
            if (!statement.trim().toUpperCase().startsWith('SELECT')) {
              throw error;
            }
          }
        }
      }
      
      logger.info(`✓ Completed: ${file}`);
    }

    logger.info('All seeds completed successfully!');
    await database.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
}

runSeeds();

