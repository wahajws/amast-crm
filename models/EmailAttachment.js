const BaseModel = require('../base/BaseModel');

class EmailAttachment extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.emailId = data.email_id || data.emailId || null;
    this.gmailAttachmentId = data.gmail_attachment_id || data.gmailAttachmentId || null;
    this.filename = data.filename || null;
    this.mimeType = data.mime_type || data.mimeType || null;
    this.size = data.size || 0;
    this.downloadUrl = data.download_url || data.downloadUrl || null;
  }

  static getTableName() {
    return 'email_attachments';
  }

  static getFillableFields() {
    return [
      'email_id',
      'gmail_attachment_id',
      'filename',
      'mime_type',
      'size',
      'download_url'
    ];
  }

  validate() {
    const errors = [];

    if (!this.emailId) {
      errors.push('Email ID is required');
    }
    if (!this.gmailAttachmentId) {
      errors.push('Gmail attachment ID is required');
    }
    if (!this.filename) {
      errors.push('Filename is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = EmailAttachment;







