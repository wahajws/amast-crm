const BaseRepository = require('../base/BaseRepository');
const Opportunity = require('../models/Opportunity');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn } = require('../utils/fieldMapper');

class OpportunityRepository extends BaseRepository {
  constructor() {
    super(Opportunity);
    this.accountTable = getTableName('Account');
    this.contactTable = getTableName('Contact');
    this.userTable = getTableName('User');
  }

  async findById(id) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const sql = `SELECT o.*, 
                         a.${primaryKeyCol} as account_account_id,
                         a.name as account_name,
                         c.${primaryKeyCol} as contact_contact_id,
                         c.first_name as contact_first_name,
                         c.last_name as contact_last_name,
                         u.${primaryKeyCol} as owner_user_id, 
                         u.first_name as owner_first_name, 
                         u.last_name as owner_last_name,
                         u.email as owner_email
                  FROM ${this.tableName} o 
                  LEFT JOIN ${this.accountTable} a ON o.account_id = a.${primaryKeyCol} 
                  LEFT JOIN ${this.contactTable} c ON o.contact_id = c.${primaryKeyCol} 
                  LEFT JOIN ${this.userTable} u ON o.owner_id = u.${primaryKeyCol} 
                  WHERE o.${primaryKeyCol} = ? AND o.${deletedAtCol} IS NULL 
                  LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const opportunity = Opportunity.fromDatabaseRow(results[0]);
      if (results[0].account_account_id) {
        opportunity.account = {
          id: results[0].account_account_id,
          name: results[0].account_name
        };
      }
      if (results[0].contact_contact_id) {
        opportunity.contact = {
          id: results[0].contact_contact_id,
          firstName: results[0].contact_first_name,
          lastName: results[0].contact_last_name
        };
      }
      if (results[0].owner_user_id) {
        opportunity.owner = {
          id: results[0].owner_user_id,
          firstName: results[0].owner_first_name,
          lastName: results[0].owner_last_name,
          email: results[0].owner_email
        };
      }
      return opportunity;
    }
    return null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'o.created_at',
      order = 'DESC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    
    let whereClause = '';
    let whereParams = [...params];
    
    // Build WHERE clause
    const conditions = [];
    if (where && where.trim() !== '') {
      conditions.push(`(${where})`);
    }
    conditions.push(`o.${deletedAtCol} IS NULL`);
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} o ${whereClause}`;
    const dataSql = `SELECT o.*, 
                           a.${primaryKeyCol} as account_account_id,
                           a.name as account_name,
                           c.${primaryKeyCol} as contact_contact_id,
                           c.first_name as contact_first_name,
                           c.last_name as contact_last_name,
                           u.${primaryKeyCol} as owner_user_id, 
                           u.first_name as owner_first_name, 
                           u.last_name as owner_last_name,
                           u.email as owner_email
                    FROM ${this.tableName} o 
                    LEFT JOIN ${this.accountTable} a ON o.account_id = a.${primaryKeyCol} 
                    LEFT JOIN ${this.contactTable} c ON o.contact_id = c.${primaryKeyCol} 
                    LEFT JOIN ${this.userTable} u ON o.owner_id = u.${primaryKeyCol} 
                    ${whereClause} 
                    ORDER BY ${orderBy} ${order} 
                    LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [countResult] = await this.query(countSql, whereParams);
    const total = countResult.total || 0;

    const data = await this.query(dataSql, whereParams);
    
    const opportunities = data.map(row => {
      const opportunity = Opportunity.fromDatabaseRow(row);
      if (row.account_account_id) {
        opportunity.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      if (row.contact_contact_id) {
        opportunity.contact = {
          id: row.contact_contact_id,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name
        };
      }
      if (row.owner_user_id) {
        opportunity.owner = {
          id: row.owner_user_id,
          firstName: row.owner_first_name,
          lastName: row.owner_last_name,
          email: row.owner_email
        };
      }
      return opportunity;
    });
    
    return {
      data: opportunities,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

module.exports = OpportunityRepository;

