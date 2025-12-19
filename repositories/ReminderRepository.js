const BaseRepository = require('../base/BaseRepository');
const Reminder = require('../models/Reminder');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn, getCreatedByColumn } = require('../utils/fieldMapper');

class ReminderRepository extends BaseRepository {
  constructor() {
    super(Reminder);
    this.contactTable = getTableName('Contact');
    this.accountTable = getTableName('Account');
    this.userTable = getTableName('User');
  }

  async findById(id) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const createdByCol = getCreatedByColumn();
    const sql = `SELECT r.*, 
                         c.${primaryKeyCol} as contact_contact_id,
                         c.first_name as contact_first_name,
                         c.last_name as contact_last_name,
                         a.${primaryKeyCol} as account_account_id,
                         a.name as account_name,
                         u.${primaryKeyCol} as creator_user_id,
                         u.first_name as creator_first_name,
                         u.last_name as creator_last_name
                  FROM ${this.tableName} r 
                  LEFT JOIN ${this.contactTable} c ON r.contact_id = c.${primaryKeyCol} 
                  LEFT JOIN ${this.accountTable} a ON r.account_id = a.${primaryKeyCol} 
                  LEFT JOIN ${this.userTable} u ON r.${createdByCol} = u.${primaryKeyCol} 
                  WHERE r.${primaryKeyCol} = ? AND r.${deletedAtCol} IS NULL 
                  LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const reminder = Reminder.fromDatabaseRow(results[0]);
      if (results[0].contact_contact_id) {
        reminder.contact = {
          id: results[0].contact_contact_id,
          firstName: results[0].contact_first_name,
          lastName: results[0].contact_last_name
        };
      }
      if (results[0].account_account_id) {
        reminder.account = {
          id: results[0].account_account_id,
          name: results[0].account_name
        };
      }
      if (results[0].creator_user_id) {
        reminder.creator = {
          id: results[0].creator_user_id,
          firstName: results[0].creator_first_name,
          lastName: results[0].creator_last_name
        };
      }
      return reminder;
    }
    return null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'r.due_date',
      order = 'ASC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const createdByCol = getCreatedByColumn();
    
    let whereClause = `WHERE r.${deletedAtCol} IS NULL`;
    let whereParams = [...params];
    
    if (where && where.trim() !== '') {
      whereClause = `WHERE (${where}) AND r.${deletedAtCol} IS NULL`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} r ${whereClause}`;
    const dataSql = `SELECT r.*, 
                           c.${primaryKeyCol} as contact_contact_id,
                           c.first_name as contact_first_name,
                           c.last_name as contact_last_name,
                           a.${primaryKeyCol} as account_account_id,
                           a.name as account_name,
                           u.${primaryKeyCol} as creator_user_id,
                           u.first_name as creator_first_name,
                           u.last_name as creator_last_name
                    FROM ${this.tableName} r 
                    LEFT JOIN ${this.contactTable} c ON r.contact_id = c.${primaryKeyCol} 
                    LEFT JOIN ${this.accountTable} a ON r.account_id = a.${primaryKeyCol} 
                    LEFT JOIN ${this.userTable} u ON r.${createdByCol} = u.${primaryKeyCol} 
                    ${whereClause} 
                    ORDER BY ${orderBy} ${order} 
                    LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [countResult] = await this.query(countSql, whereParams);
    const total = countResult.total || 0;

    const data = await this.query(dataSql, whereParams);
    
    const reminders = data.map(row => {
      const reminder = Reminder.fromDatabaseRow(row);
      if (row.contact_contact_id) {
        reminder.contact = {
          id: row.contact_contact_id,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name
        };
      }
      if (row.account_account_id) {
        reminder.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      if (row.creator_user_id) {
        reminder.creator = {
          id: row.creator_user_id,
          firstName: row.creator_first_name,
          lastName: row.creator_last_name
        };
      }
      return reminder;
    });
    
    return {
      data: reminders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async findByContactId(contactId, options = {}) {
    return this.findAll({
      ...options,
      where: 'r.contact_id = ?',
      params: [contactId]
    });
  }

  async findByAccountId(accountId, options = {}) {
    return this.findAll({
      ...options,
      where: 'r.account_id = ?',
      params: [accountId]
    });
  }

  async findUpcoming(userId = null, limit = 10) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const createdByCol = getCreatedByColumn();
    
    // Convert limit to integer
    const limitValue = parseInt(limit, 10) || 10;
    if (isNaN(limitValue) || limitValue < 0) {
      throw new Error('Invalid limit parameter');
    }
    
    let whereClause = `WHERE r.${deletedAtCol} IS NULL AND r.status = 'PENDING' AND r.due_date >= NOW()`;
    let params = [];
    
    if (userId) {
      whereClause += ` AND r.${createdByCol} = ?`;
      params.push(userId);
    }
    
    const sql = `SELECT r.*, 
                       c.${primaryKeyCol} as contact_contact_id,
                       c.first_name as contact_first_name,
                       c.last_name as contact_last_name,
                       a.${primaryKeyCol} as account_account_id,
                       a.name as account_name
                FROM ${this.tableName} r 
                LEFT JOIN ${this.contactTable} c ON r.contact_id = c.${primaryKeyCol} AND c.${deletedAtCol} IS NULL
                LEFT JOIN ${this.accountTable} a ON r.account_id = a.${primaryKeyCol} AND a.${deletedAtCol} IS NULL
                ${whereClause} 
                ORDER BY r.due_date ASC 
                LIMIT ${limitValue}`;
    
    const results = await this.query(sql, params);
    
    // Format results with contact and account data
    return results.map(row => {
      const reminder = Reminder.fromDatabaseRow(row);
      if (row.contact_contact_id) {
        reminder.contact = {
          id: row.contact_contact_id,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name
        };
      }
      if (row.account_account_id) {
        reminder.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      return reminder;
    });
  }
}

module.exports = ReminderRepository;

