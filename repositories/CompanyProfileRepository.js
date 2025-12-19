const BaseRepository = require('../base/BaseRepository');
const CompanyProfile = require('../models/CompanyProfile');

class CompanyProfileRepository extends BaseRepository {
  constructor() {
    super(CompanyProfile);
  }

  async findByUserId(userId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`;
    const results = await this.query(sql, [userId]);
    return CompanyProfile.fromDatabaseRows(results);
  }

  async findByUrl(companyUrl, userId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE company_url = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1`;
    const results = await this.query(sql, [companyUrl, userId]);
    return results.length > 0 ? CompanyProfile.fromDatabaseRow(results[0]) : null;
  }
}

module.exports = CompanyProfileRepository;

