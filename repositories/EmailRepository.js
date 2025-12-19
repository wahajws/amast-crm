const BaseRepository = require('../base/BaseRepository');
const Email = require('../models/Email');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn } = require('../utils/fieldMapper');

class EmailRepository extends BaseRepository {
  constructor() {
    super(Email);
    this.contactTable = getTableName('Contact');
    this.accountTable = getTableName('Account');
  }

  async findByGmailMessageId(gmailMessageId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE gmail_message_id = ? LIMIT 1`;
    const results = await this.query(sql, [gmailMessageId]);
    return results.length > 0 ? Email.fromDatabaseRow(results[0]) : null;
  }

  async findByThreadId(threadId, userId) {
    const deletedAtCol = getSoftDeleteColumn();
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE thread_id = ? AND user_id = ? AND ${deletedAtCol} IS NULL 
                 ORDER BY received_at ASC`;
    const results = await this.query(sql, [threadId, userId]);
    return results.map(row => Email.fromDatabaseRow(row));
  }

  async findByAccountId(accountId, userId) {
    const deletedAtCol = getSoftDeleteColumn();
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE account_id = ? AND user_id = ? AND ${deletedAtCol} IS NULL 
                 ORDER BY received_at DESC`;
    const results = await this.query(sql, [accountId, userId]);
    return results.map(row => Email.fromDatabaseRow(row));
  }

  async findByContactId(contactId, userId) {
    const deletedAtCol = getSoftDeleteColumn();
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE contact_id = ? AND user_id = ? AND ${deletedAtCol} IS NULL 
                 ORDER BY received_at DESC`;
    const results = await this.query(sql, [contactId, userId]);
    return results.map(row => Email.fromDatabaseRow(row));
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'e.received_at',
      order = 'DESC',
      where = '',
      params = [],
      userId = null
    } = options;

    const offset = (page - 1) * pageSize;
    const deletedAtCol = getSoftDeleteColumn();
    
    // Build WHERE clause - normalize to use 'e.' prefix for email table columns
    let whereClause = `WHERE e.${deletedAtCol} IS NULL`;
    let whereParams = [];
    
    if (userId) {
      whereClause += ' AND e.user_id = ?';
      whereParams.push(userId);
    }
    
    if (where && where.trim() !== '') {
      // The where clause from controller should already have 'e.' prefix
      // Just use it as-is if it has the prefix, otherwise add it
      let normalizedWhere = where;
      // Only add 'e.' prefix if the column doesn't already have a table prefix
      if (!normalizedWhere.includes('e.') && !normalizedWhere.includes('c.') && !normalizedWhere.includes('a.')) {
        // Add 'e.' prefix to email table column references that don't have a prefix
        normalizedWhere = normalizedWhere.replace(/\b(contact_id|account_id|user_id|subject|from_email|body_text|received_at|sent_at|gmail_message_id|thread_id|from_name|to_email|cc_email|bcc_email|body_html|is_read|is_starred|label_ids|attachment_count)\b/g, 'e.$1');
      }
      whereClause += ` AND ${normalizedWhere}`;
      whereParams = [...whereParams, ...(Array.isArray(params) ? params : [])];
    }
    
    // Count query - use subquery to match the same WHERE conditions
    const countSql = `SELECT COUNT(*) as total 
                     FROM ${this.tableName} e 
                     ${whereClause}`;
    
    let total = 0;
    try {
      const [countResult] = await this.query(countSql, whereParams);
      total = countResult ? (countResult.total || 0) : 0;
    } catch (error) {
      const { logger } = require('../utils/logger');
      logger.error('Error in count query:', error);
      logger.error('Count SQL:', countSql);
      logger.error('Count params:', whereParams);
      throw error;
    }

    // Data query
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const dataSql = `SELECT e.*, 
                            c.first_name as contact_first_name, 
                            c.last_name as contact_last_name,
                            c.email as contact_email,
                            a.name as account_name
                     FROM ${this.tableName} e 
                     LEFT JOIN ${this.contactTable} c ON e.contact_id = c.id
                     LEFT JOIN ${this.accountTable} a ON e.account_id = a.id
                     ${whereClause} 
                     ORDER BY ${orderBy.includes('.') ? orderBy : `e.${orderBy}`} ${order} 
                     LIMIT ${limitValue} OFFSET ${offsetValue}`;
    
    let data = [];
    try {
      data = await this.query(dataSql, whereParams);
    } catch (error) {
      const { logger } = require('../utils/logger');
      logger.error('Error in data query:', error);
      logger.error('Data SQL:', dataSql);
      logger.error('Data params:', whereParams);
      throw error;
    }
    
    const emails = data.map(row => {
      const email = Email.fromDatabaseRow(row);
      if (row.contact_first_name) {
        email.contact = {
          id: email.contactId,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name,
          email: row.contact_email
        };
      }
      if (row.account_name) {
        email.account = {
          id: email.accountId,
          name: row.account_name
        };
      }
      return email;
    });
    
    return {
      data: emails,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async findByContactId(contactId, userId) {
    const deletedAtCol = getSoftDeleteColumn();
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE contact_id = ? AND user_id = ? AND ${deletedAtCol} IS NULL 
                 ORDER BY received_at DESC`;
    const results = await this.query(sql, [contactId, userId]);
    return results.map(row => Email.fromDatabaseRow(row));
  }

  async findByAccountId(accountId, userId) {
    const deletedAtCol = getSoftDeleteColumn();
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE account_id = ? AND user_id = ? AND ${deletedAtCol} IS NULL 
                 ORDER BY received_at DESC`;
    const results = await this.query(sql, [accountId, userId]);
    return results.map(row => Email.fromDatabaseRow(row));
  }

  async linkToContact(emailId, contactId) {
    const sql = `UPDATE ${this.tableName} SET contact_id = ? WHERE id = ?`;
    await this.query(sql, [contactId, emailId]);
  }

  async linkToAccount(emailId, accountId) {
    const sql = `UPDATE ${this.tableName} SET account_id = ? WHERE id = ?`;
    await this.query(sql, [accountId, emailId]);
  }

  async getUnlinkedEmails(userId, limit = 50) {
    const deletedAtCol = getSoftDeleteColumn();
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE user_id = ? AND contact_id IS NULL AND account_id IS NULL AND ${deletedAtCol} IS NULL 
                 ORDER BY received_at DESC 
                 LIMIT ?`;
    const results = await this.query(sql, [userId, limit]);
    return results.map(row => Email.fromDatabaseRow(row));
  }

  /**
   * Find emails by domain matching
   * Matches emails where the from_email domain matches the account name
   * @param {string} accountName - Account name to match
   * @param {number} userId - User ID
   * @returns {Array<Email>} - Array of matching emails
   */
  async findByDomain(accountName, userId) {
    const { normalizeAccountName, normalizeDomain } = require('../utils/domainMatcher');
    const deletedAtCol = getSoftDeleteColumn();
    
    // Normalize account name for matching
    const normalizedAccount = normalizeAccountName(accountName);
    
    // Get all emails for user
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE user_id = ? AND ${deletedAtCol} IS NULL 
                 ORDER BY received_at ASC`;
    const results = await this.query(sql, [userId]);
    
    // Filter emails where domain matches account
    const matchingEmails = results
      .map(row => Email.fromDatabaseRow(row))
      .filter(email => {
        if (!email.fromEmail) return false;
        
        const emailDomain = email.fromEmail.toLowerCase();
        const domainBase = emailDomain.split('@')[1]?.split('.')[0] || '';
        
        // Check if normalized account matches domain base
        return normalizedAccount === domainBase || 
               domainBase.includes(normalizedAccount) || 
               normalizedAccount.includes(domainBase);
      });
    
    return matchingEmails;
  }

  /**
   * Get emails for account by ID or domain matching
   * @param {number} accountId - Account ID (optional)
   * @param {string} accountName - Account name for domain matching (optional)
   * @param {number} userId - User ID
   * @returns {Array<Email>} - Array of emails
   */
  async findByAccount(accountId, accountName, userId) {
    const deletedAtCol = getSoftDeleteColumn();
    
    // If accountId is provided, use direct lookup
    if (accountId) {
      return this.findByAccountId(accountId, userId);
    }
    
    // Otherwise, use domain matching
    if (accountName) {
      return this.findByDomain(accountName, userId);
    }
    
    return [];
  }
}

module.exports = EmailRepository;

