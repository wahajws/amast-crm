const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_system',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test connection
      const connection = await this.pool.getConnection();
      logger.info('Database connected successfully');
      connection.release();

      return this.pool;
    } catch (error) {
      logger.error('Database connection error:', error);
      throw error;
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return this.pool;
  }

  async query(sql, params = []) {
    try {
      // If no params, use query() directly (for queries without placeholders)
      if (!params || params.length === 0) {
        const [results] = await this.pool.query(sql);
        return results;
      }
      
      // Use execute() for prepared statements with params
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      logger.error('Database query error:', { sql, params, error: error.message });
      throw error;
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection closed');
    }
  }
}

// Singleton instance
const database = new Database();

module.exports = database;
