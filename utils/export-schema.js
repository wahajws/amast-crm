require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

async function exportSchema() {
  let connection;
  
  try {
    // Get database credentials from environment or prompt
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_USER = process.env.DB_USER || 'root';
    const DB_PASSWORD = process.env.DB_PASSWORD || '';
    const DB_NAME = process.env.DB_NAME || 'crm_system';

    console.log('==========================================');
    console.log('Export Database Schema from Localhost');
    console.log('==========================================');
    console.log('');
    console.log(`Database: ${DB_NAME}`);
    console.log(`Host: ${DB_HOST}`);
    console.log(`User: ${DB_USER}`);
    console.log('');

    // Connect to database
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true
    });

    console.log('✓ Connected to database');
    console.log('');

    // Get all tables
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `, [DB_NAME]);

    console.log(`Found ${tables.length} tables`);
    console.log('');

    let schemaContent = `-- ============================================\n`;
    schemaContent += `-- Database Schema Export\n`;
    schemaContent += `-- Database: ${DB_NAME}\n`;
    schemaContent += `-- Exported: ${new Date().toISOString()}\n`;
    schemaContent += `-- ============================================\n\n`;
    schemaContent += `USE ${DB_NAME};\n\n`;

    // Export each table structure
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`  Exporting: ${tableName}`);

      // Get CREATE TABLE statement
      const [createTable] = await connection.query(
        `SHOW CREATE TABLE \`${tableName}\``
      );

      if (createTable && createTable[0]) {
        let createStatement = createTable[0]['Create Table'];
        
        // Add IF NOT EXISTS
        createStatement = createStatement.replace(/^CREATE TABLE/, 'CREATE TABLE IF NOT EXISTS');
        
        schemaContent += `-- Table: ${tableName}\n`;
        schemaContent += `${createStatement};\n\n`;
      }
    }

    // Get all views
    const [views] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.VIEWS 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [DB_NAME]);

    if (views.length > 0) {
      schemaContent += `-- ============================================\n`;
      schemaContent += `-- Views\n`;
      schemaContent += `-- ============================================\n\n`;
      
      for (const view of views) {
        const viewName = view.TABLE_NAME;
        console.log(`  Exporting view: ${viewName}`);

        const [createView] = await connection.query(
          `SHOW CREATE VIEW \`${viewName}\``
        );

        if (createView && createView[0]) {
          let createStatement = createView[0]['Create View'];
          schemaContent += `-- View: ${viewName}\n`;
          schemaContent += `${createStatement};\n\n`;
        }
      }
    }

    // Write to file
    const outputFile = path.join(__dirname, '..', 'database_schema.txt');
    fs.writeFileSync(outputFile, schemaContent, 'utf8');

    console.log('');
    console.log('✓ Schema exported successfully!');
    console.log('');
    console.log(`File: ${outputFile}`);
    console.log('');
    console.log('Next step: Run node utils/create-migration-from-schema.js');
    console.log('');

    await connection.end();
    process.exit(0);
  } catch (error) {
    logger.error('Export failed:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

exportSchema();

