const BaseRepository = require('../base/BaseRepository');
const EmailAttachment = require('../models/EmailAttachment');

class EmailAttachmentRepository extends BaseRepository {
  constructor() {
    super(EmailAttachment);
  }

  async findByEmailId(emailId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE email_id = ? ORDER BY filename`;
    const results = await this.query(sql, [emailId]);
    return results.map(row => EmailAttachment.fromDatabaseRow(row));
  }

  async findByGmailAttachmentId(gmailAttachmentId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE gmail_attachment_id = ? LIMIT 1`;
    const results = await this.query(sql, [gmailAttachmentId]);
    return results.length > 0 ? EmailAttachment.fromDatabaseRow(results[0]) : null;
  }
}

module.exports = EmailAttachmentRepository;







