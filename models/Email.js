const BaseModel = require('../base/BaseModel');

class Email extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.gmailMessageId = data.gmail_message_id || data.gmailMessageId || null;
    this.threadId = data.thread_id || data.threadId || null;
    this.subject = data.subject || null;
    this.fromEmail = data.from_email || data.fromEmail || null;
    this.fromName = data.from_name || data.fromName || null;
    this.toEmail = data.to_email || data.toEmail || null;
    this.ccEmail = data.cc_email || data.ccEmail || null;
    this.bccEmail = data.bcc_email || data.bccEmail || null;
    this.bodyText = data.body_text || data.bodyText || null;
    this.bodyHtml = data.body_html || data.bodyHtml || null;
    this.receivedAt = data.received_at || data.receivedAt || null;
    this.sentAt = data.sent_at || data.sentAt || null;
    this.isRead = data.is_read !== undefined ? data.is_read : (data.isRead !== undefined ? data.isRead : false);
    this.isStarred = data.is_starred !== undefined ? data.is_starred : (data.isStarred !== undefined ? data.isStarred : false);
    this.labelIds = data.label_ids || data.labelIds || null;
    this.attachmentCount = data.attachment_count || data.attachmentCount || 0;
    this.contactId = data.contact_id || data.contactId || null;
    this.accountId = data.account_id || data.accountId || null;
    this.userId = data.user_id || data.userId || null;
  }

  static getTableName() {
    return 'emails';
  }

  static getFillableFields() {
    return [
      'gmail_message_id',
      'thread_id',
      'subject',
      'from_email',
      'from_name',
      'to_email',
      'cc_email',
      'bcc_email',
      'body_text',
      'body_html',
      'received_at',
      'sent_at',
      'is_read',
      'is_starred',
      'label_ids',
      'attachment_count',
      'contact_id',
      'account_id',
      'user_id'
    ];
  }

  validate() {
    const errors = [];

    if (!this.gmailMessageId) {
      errors.push('Gmail message ID is required');
    }
    if (!this.fromEmail) {
      errors.push('From email is required');
    }
    if (!this.userId) {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Email;







