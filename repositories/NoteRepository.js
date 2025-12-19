const BaseRepository = require('../base/BaseRepository');
const Note = require('../models/Note');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn, getCreatedByColumn } = require('../utils/fieldMapper');

class NoteRepository extends BaseRepository {
  constructor() {
    super(Note);
    this.contactTable = getTableName('Contact');
    this.accountTable = getTableName('Account');
    this.userTable = getTableName('User');
  }

  async findById(id) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const createdByCol = getCreatedByColumn();
    const sql = `SELECT n.*, 
                         c.${primaryKeyCol} as contact_contact_id,
                         c.first_name as contact_first_name,
                         c.last_name as contact_last_name,
                         a.${primaryKeyCol} as account_account_id,
                         a.name as account_name,
                         u.${primaryKeyCol} as creator_user_id,
                         u.first_name as creator_first_name,
                         u.last_name as creator_last_name
                  FROM ${this.tableName} n 
                  LEFT JOIN ${this.contactTable} c ON n.contact_id = c.${primaryKeyCol} 
                  LEFT JOIN ${this.accountTable} a ON n.account_id = a.${primaryKeyCol} 
                  LEFT JOIN ${this.userTable} u ON n.${createdByCol} = u.${primaryKeyCol} 
                  WHERE n.${primaryKeyCol} = ? AND n.${deletedAtCol} IS NULL 
                  LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const note = Note.fromDatabaseRow(results[0]);
      if (results[0].contact_contact_id) {
        note.contact = {
          id: results[0].contact_contact_id,
          firstName: results[0].contact_first_name,
          lastName: results[0].contact_last_name
        };
      }
      if (results[0].account_account_id) {
        note.account = {
          id: results[0].account_account_id,
          name: results[0].account_name
        };
      }
      if (results[0].creator_user_id) {
        note.creator = {
          id: results[0].creator_user_id,
          firstName: results[0].creator_first_name,
          lastName: results[0].creator_last_name
        };
      }
      return note;
    }
    return null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'n.created_at',
      order = 'DESC',
      where = '',
      params = []
    } = options;

    const offset = (page - 1) * pageSize;
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const createdByCol = getCreatedByColumn();
    
    let whereClause = `WHERE n.${deletedAtCol} IS NULL`;
    let whereParams = [...params];
    
    if (where && where.trim() !== '') {
      whereClause = `WHERE (${where}) AND n.${deletedAtCol} IS NULL`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} n ${whereClause}`;
    const dataSql = `SELECT n.*, 
                           c.${primaryKeyCol} as contact_contact_id,
                           c.first_name as contact_first_name,
                           c.last_name as contact_last_name,
                           a.${primaryKeyCol} as account_account_id,
                           a.name as account_name,
                           u.${primaryKeyCol} as creator_user_id,
                           u.first_name as creator_first_name,
                           u.last_name as creator_last_name
                    FROM ${this.tableName} n 
                    LEFT JOIN ${this.contactTable} c ON n.contact_id = c.${primaryKeyCol} 
                    LEFT JOIN ${this.accountTable} a ON n.account_id = a.${primaryKeyCol} 
                    LEFT JOIN ${this.userTable} u ON n.${createdByCol} = u.${primaryKeyCol} 
                    ${whereClause} 
                    ORDER BY ${orderBy} ${order} 
                    LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [countResult] = await this.query(countSql, whereParams);
    const total = countResult.total || 0;

    const data = await this.query(dataSql, whereParams);
    
    const notes = data.map(row => {
      const note = Note.fromDatabaseRow(row);
      if (row.contact_contact_id) {
        note.contact = {
          id: row.contact_contact_id,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name
        };
      }
      if (row.account_account_id) {
        note.account = {
          id: row.account_account_id,
          name: row.account_name
        };
      }
      if (row.creator_user_id) {
        note.creator = {
          id: row.creator_user_id,
          firstName: row.creator_first_name,
          lastName: row.creator_last_name
        };
      }
      return note;
    });
    
    return {
      data: notes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async findByContactId(contactId, options = {}) {
    return this.findAll({
      ...options,
      where: 'n.contact_id = ?',
      params: [contactId]
    });
  }

  async findByAccountId(accountId, options = {}) {
    return this.findAll({
      ...options,
      where: 'n.account_id = ?',
      params: [accountId]
    });
  }
}

module.exports = NoteRepository;

