const BaseRepository = require('../base/BaseRepository');
const Account = require('../models/Account');
const { getTableName } = require('../utils/modelRegistry');
const { getSoftDeleteColumn, getPrimaryKeyColumn } = require('../utils/fieldMapper');

class AccountRepository extends BaseRepository {
  constructor() {
    super(Account);
    this.userTable = getTableName('User');
  }

  async findById(id) {
    const deletedAtCol = getSoftDeleteColumn();
    const primaryKeyCol = getPrimaryKeyColumn();
    const sql = `SELECT a.*, 
                         u.${primaryKeyCol} as owner_user_id, 
                         u.first_name as owner_first_name, 
                         u.last_name as owner_last_name,
                         u.email as owner_email
                  FROM ${this.tableName} a 
                  LEFT JOIN ${this.userTable} u ON a.owner_id = u.${primaryKeyCol} 
                  WHERE a.${primaryKeyCol} = ? AND a.${deletedAtCol} IS NULL 
                  LIMIT 1`;
    const results = await this.query(sql, [id]);
    if (results.length > 0) {
      const account = Account.fromDatabaseRow(results[0]);
      if (results[0].owner_user_id) {
        account.owner = {
          id: results[0].owner_user_id,
          firstName: results[0].owner_first_name,
          lastName: results[0].owner_last_name,
          email: results[0].owner_email
        };
      }
      return account;
    }
    return null;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'a.created_at',
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
    conditions.push(`a.${deletedAtCol} IS NULL`);
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const limitValue = parseInt(pageSize, 10);
    const offsetValue = parseInt(offset, 10);
    
    if (isNaN(limitValue) || isNaN(offsetValue) || limitValue < 0 || offsetValue < 0) {
      throw new Error('Invalid pagination parameters');
    }
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} a ${whereClause}`;
    const dataSql = `SELECT a.*, 
                           u.${primaryKeyCol} as owner_user_id, 
                           u.first_name as owner_first_name, 
                           u.last_name as owner_last_name,
                           u.email as owner_email
                    FROM ${this.tableName} a 
                    LEFT JOIN ${this.userTable} u ON a.owner_id = u.${primaryKeyCol} 
                    ${whereClause} 
                    ORDER BY ${orderBy} ${order} 
                    LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [countResult] = await this.query(countSql, whereParams);
    const total = countResult.total || 0;

    const data = await this.query(dataSql, whereParams);
    
    const accounts = data.map(row => {
      const account = Account.fromDatabaseRow(row);
      if (row.owner_user_id) {
        account.owner = {
          id: row.owner_user_id,
          firstName: row.owner_first_name,
          lastName: row.owner_last_name,
          email: row.owner_email
        };
      }
      return account;
    });
    
    return {
      data: accounts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Get accounts with email counts
   * Returns accounts with count of emails matching their domain
   * @param {number} userId - User ID
   * @param {Object} currentUser - Current user object for role-based filtering
   * @returns {Array} - Array of accounts with emailCount
   */
  async getAccountsWithEmailCounts(userId, currentUser = null) {
    const deletedAtCol = getSoftDeleteColumn();
    const { normalizeAccountName } = require('../utils/domainMatcher');
    const EmailRepository = require('./EmailRepository');
    const emailRepo = new EmailRepository();
    
    // Build options with user-based filtering
    const options = {
      page: 1,
      pageSize: 1000,
      where: '',
      params: []
    };
    
    // Apply role-based filtering if user is provided
    if (currentUser) {
      const userRole = typeof currentUser.role === 'string' 
        ? currentUser.role 
        : (currentUser.role?.name || currentUser.role);
      
      // VIEWER, USER, and MANAGER can only see their own accounts
      if (userRole === 'VIEWER' || userRole === 'USER' || userRole === 'MANAGER') {
        options.where = 'a.owner_id = ?';
        options.params = [currentUser.userId || currentUser.id];
      }
      // SUPER_ADMIN and ADMIN can see all accounts (no filtering)
    }
    
    // Get accounts with proper filtering
    const accountsResult = await this.findAll(options);
    const accounts = accountsResult.data || [];
    
    // Get all emails for user
    const allEmails = await emailRepo.findAll({
      page: 1,
      pageSize: 10000,
      userId: userId
    });
    
    // Count emails per account
    const accountsWithCounts = accounts.map(account => {
      if (!account || !account.name) {
        return null;
      }
      
      try {
        const normalizedAccount = normalizeAccountName(account.name);
        let emailCount = 0;
        
        // Count emails that match this account's domain
        for (const email of (allEmails.data || [])) {
          if (!email || !email.fromEmail) continue;
          
          const emailDomain = email.fromEmail.toLowerCase();
          const domainBase = emailDomain.split('@')[1]?.split('.')[0] || '';
          
          if (normalizedAccount === domainBase || 
              domainBase.includes(normalizedAccount) || 
              normalizedAccount.includes(domainBase)) {
            emailCount++;
          }
        }
        
        return {
          ...account,
          emailCount
        };
      } catch (error) {
        // Skip accounts that cause errors
        return null;
      }
    }).filter(acc => acc !== null); // Remove null entries
    
    // Sort by email count (descending)
    accountsWithCounts.sort((a, b) => b.emailCount - a.emailCount);
    
    return accountsWithCounts;
  }
}

module.exports = AccountRepository;

