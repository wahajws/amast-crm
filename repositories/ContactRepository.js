const BaseRepository = require('../base/BaseRepository');
const Contact = require('../models/Contact');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn } = require('../utils/fieldMapper');

class ContactRepository extends BaseRepository {
  constructor() {
    super(Contact);
    this.accountTable = getTableName('Account');
    this.userTable = getTableName('User');
  }

  async findById(id) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const sql = `SELECT c.*, 
                         a.${primaryKeyCol} as account_account_id,
                         a.name as account_name,
                         u.${primaryKeyCol} as owner_user_id, 
                         u.first_name as owner_first_name, 
                         u.last_name as owner_last_name,
                         u.email as owner_email
                  FROM ${this.tableName} c 
                  LEFT JOIN ${this.accountTable} a ON c.account_id = a.${primaryKeyCol} 
                  LEFT JOIN ${this.userTable} u ON c.owner_id = u.${primaryKeyCol} 
                  WHERE c.${primaryKeyCol} = ? AND c.${deletedAtCol} IS NULL 
                  LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const contact = Contact.fromDatabaseRow(results[0]);
      if (results[0].account_account_id) {
        contact.account = {
          id: results[0].account_account_id,
          name: results[0].account_name
        };
      }
      if (results[0].owner_user_id) {
        contact.owner = {
          id: results[0].owner_user_id,
          firstName: results[0].owner_first_name,
          lastName: results[0].owner_last_name,
          email: results[0].owner_email
        };
      }
      return contact;
    }
    return null;
  }

  async findByEmail(email, userId) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    let sql = `SELECT * FROM ${this.tableName} WHERE email = ? AND ${deletedAtCol} IS NULL`;
    const params = [email];
    
    if (userId) {
      sql += ' AND owner_id = ?';
      params.push(userId);
    }
    
    sql += ' LIMIT 1';
    const results = await this.query(sql, params);
    return results.length > 0 ? Contact.fromDatabaseRow(results[0]) : null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'c.created_at',
      order = 'DESC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    
    let whereClause = '';
    let whereParams = [...params];
    
    const conditions = [];
    if (where && where.trim() !== '') {
      conditions.push(`(${where})`);
    }
    conditions.push(`c.${deletedAtCol} IS NULL`);
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} c ${whereClause}`;
    const dataSql = `SELECT c.*, 
                           a.${primaryKeyCol} as account_account_id, 
                           a.name as account_name,
                           u.${primaryKeyCol} as owner_user_id, 
                           u.first_name as owner_first_name, 
                           u.last_name as owner_last_name,
                           u.email as owner_email
                    FROM ${this.tableName} c 
                    LEFT JOIN ${this.accountTable} a ON c.account_id = a.${primaryKeyCol} 
                    LEFT JOIN ${this.userTable} u ON c.owner_id = u.${primaryKeyCol} 
                    ${whereClause} 
                    ORDER BY ${orderBy} ${order} 
                    LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [countResult] = await this.query(countSql, whereParams);
    const total = countResult.total || 0;
    
    const results = await this.query(dataSql, whereParams);
    
    const contacts = results.map(row => {
      const contact = Contact.fromDatabaseRow(row);
      if (row.account_account_id) {
        contact.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      if (row.owner_user_id) {
        contact.owner = {
          id: row.owner_user_id,
          firstName: row.owner_first_name,
          lastName: row.owner_last_name,
          email: row.owner_email
        };
      }
      return contact;
    });
    
    return {
      data: contacts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Get analytics for email campaigns based on contacts with email templates
   */
  async getEmailAnalytics(userId = null) {
    const deletedAtCol = getSoftDeleteColumn();
    let whereClause = `WHERE c.${deletedAtCol} IS NULL AND c.email_template IS NOT NULL AND c.email_template != ''`;
    const params = [];
    
    if (userId) {
      whereClause += ' AND c.owner_id = ?';
      params.push(userId);
    }
    
    // Get total contacts with emails
    const totalSql = `SELECT COUNT(*) as count FROM ${this.tableName} c ${whereClause}`;
    const totalResults = await this.query(totalSql, params);
    const total = totalResults[0]?.count || 0;
    
    // Get contacts with emails but not sent (no email_campaigns record or status = PENDING)
    const pendingSql = `SELECT COUNT(*) as count 
                        FROM ${this.tableName} c 
                        LEFT JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                        ${whereClause}
                        AND (ec.id IS NULL OR ec.status = 'PENDING')`;
    const pendingResults = await this.query(pendingSql, params);
    const pending = pendingResults[0]?.count || 0;
    
    // Get contacts with sent emails
    const sentSql = `SELECT COUNT(*) as count 
                     FROM ${this.tableName} c 
                     INNER JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                     ${whereClause.replace('c.', 'c.')}
                     AND ec.status = 'SENT'`;
    const sentResults = await this.query(sentSql, params);
    const sent = sentResults[0]?.count || 0;
    
    // Get contacts with communication started
    const commSql = `SELECT COUNT(*) as count 
                     FROM ${this.tableName} c 
                     INNER JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                     ${whereClause.replace('c.', 'c.')}
                     AND ec.communication_started = 1`;
    const commResults = await this.query(commSql, params);
    const communicationStarted = commResults[0]?.count || 0;
    
    // Get emails by user (from email_campaigns sent_by)
    const userSql = `SELECT u.${getPrimaryKeyColumn()} as user_id,
                            u.first_name,
                            u.last_name,
                            COUNT(*) as sent_count
                     FROM ${this.tableName} c 
                     INNER JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                     LEFT JOIN ${this.userTable} u ON ec.sent_by = u.${getPrimaryKeyColumn()}
                     ${whereClause.replace('c.', 'c.')}
                     AND ec.sent_by IS NOT NULL
                     GROUP BY u.${getPrimaryKeyColumn()}, u.first_name, u.last_name
                     ORDER BY sent_count DESC`;
    const userResults = await this.query(userSql, params);
    
    // Get pending emails older than 7 days
    const urgentSql = `SELECT COUNT(*) as count 
                       FROM ${this.tableName} c 
                       LEFT JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                       ${whereClause}
                       AND (ec.id IS NULL OR ec.status = 'PENDING')
                       AND c.email_generated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    const urgentResults = await this.query(urgentSql, params);
    const urgentPending = urgentResults[0]?.count || 0;
    
    return {
      total,
      pending,
      sent,
      communicationStarted,
      urgentPending,
      byUser: userResults.map(row => ({
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        sentCount: row.sent_count
      }))
    };
  }

  /**
   * Get urgent recommendations - contacts with emails that need attention
   */
  async getUrgentEmailRecommendations(userId = null, limit = 10) {
    const deletedAtCol = getSoftDeleteColumn();
    let whereClause = `WHERE c.${deletedAtCol} IS NULL 
                       AND c.email_template IS NOT NULL 
                       AND c.email_template != ''`;
    const params = [];
    
    if (userId) {
      whereClause += ' AND c.owner_id = ?';
      params.push(userId);
    }
    
    const limitValue = parseInt(limit, 10);
    if (isNaN(limitValue) || limitValue < 0) {
      throw new Error('Invalid limit parameter');
    }
    
    const sql = `SELECT c.*, 
                       a.name as account_name,
                       ec.status as campaign_status,
                       ec.communication_started,
                       ec.sent_at
                FROM ${this.tableName} c 
                LEFT JOIN ${this.accountTable} a ON c.account_id = a.${getPrimaryKeyColumn()}
                LEFT JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                ${whereClause}
                AND (
                  ec.id IS NULL 
                  OR ec.status = 'PENDING'
                  OR (ec.status = 'SENT' AND ec.communication_started = 0)
                )
                AND (
                  c.email_generated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
                  OR ec.id IS NULL
                )
                ORDER BY 
                  CASE 
                    WHEN ec.id IS NULL THEN 1
                    WHEN ec.status = 'PENDING' THEN 2
                    ELSE 3
                  END,
                  c.email_generated_at ASC
                LIMIT ${limitValue}`;
    
    const results = await this.query(sql, params);
    return results.map(row => {
      const contact = Contact.fromDatabaseRow(row);
      contact.account = row.account_name ? { name: row.account_name } : null;
      contact.campaignStatus = row.campaign_status || 'NOT_CREATED';
      contact.communicationStarted = row.communication_started || false;
      contact.sentAt = row.sent_at || null;
      return contact;
    });
  }

  /**
   * Find contacts (for email campaigns list) - shows all contacts, not just those with emails
   */
  async findWithEmails(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'c.created_at',
      order = 'DESC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    
    let whereClause = '';
    let whereParams = [...params];
    
    const conditions = [];
    if (where && where.trim() !== '') {
      conditions.push(`(${where})`);
    }
    conditions.push(`c.${deletedAtCol} IS NULL`);
    // Removed filter for email_template - show all contacts
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    // Always join email_campaigns for count query since filters may reference it
    const countSql = `SELECT COUNT(DISTINCT c.id) as total 
                      FROM ${this.tableName} c 
                      LEFT JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                      ${whereClause}`;
    const countResults = await this.query(countSql, whereParams);
    const total = countResults[0]?.total || 0;
    
    // Get paginated results with joins
    const sql = `SELECT c.*, 
                       a.${primaryKeyCol} as account_account_id,
                       a.name as account_name,
                       u.${primaryKeyCol} as owner_user_id,
                       u.first_name as owner_first_name,
                       u.last_name as owner_last_name,
                       ec.id as campaign_id,
                       ec.status as campaign_status,
                       ec.priority as campaign_priority,
                       ec.sent_at,
                       ec.sent_by,
                       ec.communication_started,
                       sent_by_user.first_name as sent_by_first_name,
                       sent_by_user.last_name as sent_by_last_name
                FROM ${this.tableName} c 
                LEFT JOIN ${this.accountTable} a ON c.account_id = a.${primaryKeyCol}
                LEFT JOIN ${this.userTable} u ON c.owner_id = u.${primaryKeyCol}
                LEFT JOIN email_campaigns ec ON c.id = ec.contact_id AND ec.deleted_at IS NULL
                LEFT JOIN ${this.userTable} sent_by_user ON ec.sent_by = sent_by_user.${primaryKeyCol}
                ${whereClause}
                ORDER BY ${orderBy} ${order}
                LIMIT ${limitValue} OFFSET ${offsetValue}`;
    
    const results = await this.query(sql, whereParams);
    
    const contacts = results.map(row => {
      const contact = Contact.fromDatabaseRow(row);
      if (row.account_account_id) {
        contact.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      if (row.owner_user_id) {
        contact.owner = {
          id: row.owner_user_id,
          firstName: row.owner_first_name,
          lastName: row.owner_last_name
        };
      }
      // Add campaign info
      contact.campaignId = row.campaign_id;
      // Determine status: if no email template, it's NO_EMAIL; if no campaign, it's NOT_CREATED; otherwise use campaign status
      if (!contact.emailTemplate || contact.emailTemplate.trim() === '') {
        contact.campaignStatus = 'NO_EMAIL';
      } else if (row.campaign_status) {
        contact.campaignStatus = row.campaign_status;
      } else {
        contact.campaignStatus = 'NOT_CREATED';
      }
      contact.campaignPriority = row.campaign_priority || 'MEDIUM';
      contact.sentAt = row.sent_at;
      contact.sentBy = row.sent_by;
      contact.communicationStarted = row.communication_started || false;
      if (row.sent_by_first_name) {
        contact.sentByUser = {
          id: row.sent_by,
          firstName: row.sent_by_first_name,
          lastName: row.sent_by_last_name
        };
      }
      return contact;
    });
    
    return {
      data: contacts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

module.exports = ContactRepository;
