const BaseRepository = require('../base/BaseRepository');
const EmailCampaign = require('../models/EmailCampaign');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn } = require('../utils/fieldMapper');

class EmailCampaignRepository extends BaseRepository {
  constructor() {
    super(EmailCampaign);
    this.contactTable = getTableName('Contact');
    this.accountTable = getTableName('Account');
    this.userTable = getTableName('User');
  }

  async findById(id) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const sql = `SELECT ec.*, 
                         c.${primaryKeyCol} as contact_contact_id,
                         c.first_name as contact_first_name,
                         c.last_name as contact_last_name,
                         c.email as contact_email,
                         a.${primaryKeyCol} as account_account_id,
                         a.name as account_name,
                         u.${primaryKeyCol} as sent_by_user_id,
                         u.first_name as sent_by_first_name,
                         u.last_name as sent_by_last_name,
                         o.${primaryKeyCol} as owner_user_id,
                         o.first_name as owner_first_name,
                         o.last_name as owner_last_name
                  FROM ${this.tableName} ec 
                  LEFT JOIN ${this.contactTable} c ON ec.contact_id = c.${primaryKeyCol}
                  LEFT JOIN ${this.accountTable} a ON ec.account_id = a.${primaryKeyCol}
                  LEFT JOIN ${this.userTable} u ON ec.sent_by = u.${primaryKeyCol}
                  LEFT JOIN ${this.userTable} o ON ec.owner_id = o.${primaryKeyCol}
                  WHERE ec.${primaryKeyCol} = ? AND ec.${deletedAtCol} IS NULL 
                  LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const campaign = EmailCampaign.fromDatabaseRow(results[0]);
      if (results[0].contact_contact_id) {
        campaign.contact = {
          id: results[0].contact_contact_id,
          firstName: results[0].contact_first_name,
          lastName: results[0].contact_last_name,
          email: results[0].contact_email
        };
      }
      if (results[0].account_account_id) {
        campaign.account = {
          id: results[0].account_account_id,
          name: results[0].account_name
        };
      }
      if (results[0].sent_by_user_id) {
        campaign.sentByUser = {
          id: results[0].sent_by_user_id,
          firstName: results[0].sent_by_first_name,
          lastName: results[0].sent_by_last_name
        };
      }
      if (results[0].owner_user_id) {
        campaign.owner = {
          id: results[0].owner_user_id,
          firstName: results[0].owner_first_name,
          lastName: results[0].owner_last_name
        };
      }
      return campaign;
    }
    return null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'ec.created_at',
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
    conditions.push(`ec.${deletedAtCol} IS NULL`);
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    // Validate pagination parameters
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total 
                      FROM ${this.tableName} ec 
                      ${whereClause}`;
    const countResults = await this.query(countSql, whereParams);
    const total = countResults[0]?.total || 0;
    
    // Get paginated results with joins
    // Note: Using string interpolation for LIMIT/OFFSET as MySQL doesn't support placeholders for these
    const sql = `SELECT ec.*, 
                       c.${primaryKeyCol} as contact_contact_id,
                       c.first_name as contact_first_name,
                       c.last_name as contact_last_name,
                       c.email as contact_email,
                       a.${primaryKeyCol} as account_account_id,
                       a.name as account_name,
                       u.${primaryKeyCol} as sent_by_user_id,
                       u.first_name as sent_by_first_name,
                       u.last_name as sent_by_last_name,
                       o.${primaryKeyCol} as owner_user_id,
                       o.first_name as owner_first_name,
                       o.last_name as owner_last_name
                FROM ${this.tableName} ec 
                LEFT JOIN ${this.contactTable} c ON ec.contact_id = c.${primaryKeyCol}
                LEFT JOIN ${this.accountTable} a ON ec.account_id = a.${primaryKeyCol}
                LEFT JOIN ${this.userTable} u ON ec.sent_by = u.${primaryKeyCol}
                LEFT JOIN ${this.userTable} o ON ec.owner_id = o.${primaryKeyCol}
                ${whereClause}
                ORDER BY ${orderBy} ${order}
                LIMIT ${limitValue} OFFSET ${offsetValue}`;
    
    const results = await this.query(sql, whereParams);
    
    const campaigns = results.map(row => {
      const campaign = EmailCampaign.fromDatabaseRow(row);
      if (row.contact_contact_id) {
        campaign.contact = {
          id: row.contact_contact_id,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name,
          email: row.contact_email
        };
      }
      if (row.account_account_id) {
        campaign.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      if (row.sent_by_user_id) {
        campaign.sentByUser = {
          id: row.sent_by_user_id,
          firstName: row.sent_by_first_name,
          lastName: row.sent_by_last_name
        };
      }
      if (row.owner_user_id) {
        campaign.owner = {
          id: row.owner_user_id,
          firstName: row.owner_first_name,
          lastName: row.owner_last_name
        };
      }
      return campaign;
    });
    
    return {
      data: campaigns,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Get analytics data for dashboard
   */
  async getAnalytics(userId = null) {
    const deletedAtCol = getSoftDeleteColumn();
    let whereClause = `WHERE ec.${deletedAtCol} IS NULL`;
    const params = [];
    
    if (userId) {
      whereClause += ' AND ec.owner_id = ?';
      params.push(userId);
    }
    
    // Get counts by status
    const statusSql = `SELECT status, COUNT(*) as count 
                       FROM ${this.tableName} ec 
                       ${whereClause}
                       GROUP BY status`;
    const statusResults = await this.query(statusSql, params);
    
    // Get counts by priority
    const prioritySql = `SELECT priority, COUNT(*) as count 
                         FROM ${this.tableName} ec 
                         ${whereClause}
                         GROUP BY priority`;
    const priorityResults = await this.query(prioritySql, params);
    
    // Get emails by user (sent_by)
    const userSql = `SELECT u.${getPrimaryKeyColumn()} as user_id,
                            u.first_name,
                            u.last_name,
                            COUNT(*) as sent_count
                     FROM ${this.tableName} ec 
                     LEFT JOIN ${this.userTable} u ON ec.sent_by = u.${getPrimaryKeyColumn()}
                     ${whereClause}
                     AND ec.sent_by IS NOT NULL
                     GROUP BY u.${getPrimaryKeyColumn()}, u.first_name, u.last_name
                     ORDER BY sent_count DESC`;
    const userResults = await this.query(userSql, params);
    
    // Get communication started count
    const commSql = `SELECT COUNT(*) as count 
                     FROM ${this.tableName} ec 
                     ${whereClause}
                     AND ec.communication_started = 1`;
    const commResults = await this.query(commSql, params);
    
    // Get pending emails older than 7 days
    const urgentSql = `SELECT COUNT(*) as count 
                       FROM ${this.tableName} ec 
                       ${whereClause}
                       AND ec.status = 'PENDING'
                       AND ec.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    const urgentResults = await this.query(urgentSql, params);
    
    // Get high priority pending
    const highPrioritySql = `SELECT COUNT(*) as count 
                            FROM ${this.tableName} ec 
                            ${whereClause}
                            AND ec.status = 'PENDING'
                            AND ec.priority IN ('HIGH', 'URGENT')`;
    const highPriorityResults = await this.query(highPrioritySql, params);
    
    return {
      byStatus: statusResults.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      byPriority: priorityResults.reduce((acc, row) => {
        acc[row.priority] = row.count;
        return acc;
      }, {}),
      byUser: userResults.map(row => ({
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        sentCount: row.sent_count
      })),
      communicationStarted: commResults[0]?.count || 0,
      urgentPending: urgentResults[0]?.count || 0,
      highPriorityPending: highPriorityResults[0]?.count || 0
    };
  }

  /**
   * Get urgent recommendations
   */
  async getUrgentRecommendations(userId = null, limit = 10) {
    const deletedAtCol = getSoftDeleteColumn();
    let whereClause = `WHERE ec.${deletedAtCol} IS NULL AND ec.status = 'PENDING'`;
    const params = [];
    
    if (userId) {
      whereClause += ' AND ec.owner_id = ?';
      params.push(userId);
    }
    
    // Validate and convert limit to integer
    const limitValue = parseInt(limit, 10);
    if (isNaN(limitValue) || limitValue < 0) {
      throw new Error('Invalid limit parameter');
    }
    
    const sql = `SELECT ec.*, 
                       c.first_name as contact_first_name,
                       c.last_name as contact_last_name,
                       c.email as contact_email,
                       a.name as account_name
                FROM ${this.tableName} ec 
                LEFT JOIN ${this.contactTable} c ON ec.contact_id = c.${getPrimaryKeyColumn()}
                LEFT JOIN ${this.accountTable} a ON ec.account_id = a.${getPrimaryKeyColumn()}
                ${whereClause}
                AND (
                  ec.priority IN ('HIGH', 'URGENT') 
                  OR ec.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
                  OR ec.communication_started = 0
                )
                ORDER BY 
                  CASE ec.priority
                    WHEN 'URGENT' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                  END,
                  ec.created_at ASC
                LIMIT ${limitValue}`;
    
    const results = await this.query(sql, params);
    return results.map(row => {
      const campaign = EmailCampaign.fromDatabaseRow(row);
      campaign.contact = {
        firstName: row.contact_first_name,
        lastName: row.contact_last_name,
        email: row.contact_email
      };
      campaign.account = row.account_name ? { name: row.account_name } : null;
      return campaign;
    });
  }
}

module.exports = EmailCampaignRepository;

