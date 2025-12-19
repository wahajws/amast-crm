const BaseRepository = require('../base/BaseRepository');
const Proposal = require('../models/Proposal');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn } = require('../utils/fieldMapper');

class ProposalRepository extends BaseRepository {
  constructor() {
    super(Proposal);
    this.opportunityTable = getTableName('Opportunity');
    this.accountTable = getTableName('Account');
    this.contactTable = getTableName('Contact');
    this.userTable = getTableName('User');
  }

  async findById(id) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const sql = `SELECT p.*, 
                         opp.${primaryKeyCol} as opportunity_opportunity_id,
                         opp.name as opportunity_name,
                         a.${primaryKeyCol} as account_account_id,
                         a.name as account_name,
                         c.${primaryKeyCol} as contact_contact_id,
                         c.first_name as contact_first_name,
                         c.last_name as contact_last_name,
                         u.${primaryKeyCol} as owner_user_id, 
                         u.first_name as owner_first_name, 
                         u.last_name as owner_last_name,
                         u.email as owner_email
                  FROM ${this.tableName} p 
                  LEFT JOIN ${this.opportunityTable} opp ON p.opportunity_id = opp.${primaryKeyCol} 
                  LEFT JOIN ${this.accountTable} a ON p.account_id = a.${primaryKeyCol} 
                  LEFT JOIN ${this.contactTable} c ON p.contact_id = c.${primaryKeyCol} 
                  LEFT JOIN ${this.userTable} u ON p.owner_id = u.${primaryKeyCol} 
                  WHERE p.${primaryKeyCol} = ? AND p.${deletedAtCol} IS NULL 
                  LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const proposal = Proposal.fromDatabaseRow(results[0]);
      if (results[0].opportunity_opportunity_id) {
        proposal.opportunity = {
          id: results[0].opportunity_opportunity_id,
          name: results[0].opportunity_name
        };
      }
      if (results[0].account_account_id) {
        proposal.account = {
          id: results[0].account_account_id,
          name: results[0].account_name
        };
      }
      if (results[0].contact_contact_id) {
        proposal.contact = {
          id: results[0].contact_contact_id,
          firstName: results[0].contact_first_name,
          lastName: results[0].contact_last_name
        };
      }
      if (results[0].owner_user_id) {
        proposal.owner = {
          id: results[0].owner_user_id,
          firstName: results[0].owner_first_name,
          lastName: results[0].owner_last_name,
          email: results[0].owner_email
        };
      }
      return proposal;
    }
    return null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'p.created_at',
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
    conditions.push(`p.${deletedAtCol} IS NULL`);
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} p ${whereClause}`;
    const dataSql = `SELECT p.*, 
                           opp.${primaryKeyCol} as opportunity_opportunity_id,
                           opp.name as opportunity_name,
                           a.${primaryKeyCol} as account_account_id,
                           a.name as account_name,
                           c.${primaryKeyCol} as contact_contact_id,
                           c.first_name as contact_first_name,
                           c.last_name as contact_last_name,
                           u.${primaryKeyCol} as owner_user_id, 
                           u.first_name as owner_first_name, 
                           u.last_name as owner_last_name,
                           u.email as owner_email
                    FROM ${this.tableName} p 
                    LEFT JOIN ${this.opportunityTable} opp ON p.opportunity_id = opp.${primaryKeyCol} 
                    LEFT JOIN ${this.accountTable} a ON p.account_id = a.${primaryKeyCol} 
                    LEFT JOIN ${this.contactTable} c ON p.contact_id = c.${primaryKeyCol} 
                    LEFT JOIN ${this.userTable} u ON p.owner_id = u.${primaryKeyCol} 
                    ${whereClause} 
                    ORDER BY ${orderBy} ${order} 
                    LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [countResult] = await this.query(countSql, whereParams);
    const total = countResult.total || 0;

    const data = await this.query(dataSql, whereParams);
    
    const proposals = data.map(row => {
      const proposal = Proposal.fromDatabaseRow(row);
      if (row.opportunity_opportunity_id) {
        proposal.opportunity = {
          id: row.opportunity_opportunity_id,
          name: row.opportunity_name
        };
      }
      if (row.account_account_id) {
        proposal.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      if (row.contact_contact_id) {
        proposal.contact = {
          id: row.contact_contact_id,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name
        };
      }
      if (row.owner_user_id) {
        proposal.owner = {
          id: row.owner_user_id,
          firstName: row.owner_first_name,
          lastName: row.owner_last_name,
          email: row.owner_email
        };
      }
      return proposal;
    });
    
    return {
      data: proposals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

module.exports = ProposalRepository;

