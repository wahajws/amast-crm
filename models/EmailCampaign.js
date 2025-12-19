const BaseModel = require('../base/BaseModel');

class EmailCampaign extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.contactId = data.contact_id || data.contactId || null;
    this.accountId = data.account_id || data.accountId || null;
    this.emailSubject = data.email_subject || data.emailSubject || null;
    this.emailTemplate = data.email_template || data.emailTemplate || null;
    this.status = data.status || 'PENDING';
    this.priority = data.priority || 'MEDIUM';
    this.sentAt = data.sent_at || data.sentAt || null;
    this.sentBy = data.sent_by || data.sentBy || null;
    this.openedAt = data.opened_at || data.openedAt || null;
    this.repliedAt = data.replied_at || data.repliedAt || null;
    this.communicationStarted = data.communication_started || data.communicationStarted || false;
    this.scheduledSendAt = data.scheduled_send_at || data.scheduledSendAt || null;
    this.notes = data.notes || null;
    this.ownerId = data.owner_id || data.ownerId || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    
    // Populated from joins
    this.contact = data.contact || null;
    this.account = data.account || null;
    this.sentByUser = data.sent_by_user || null;
    this.owner = data.owner || null;
  }

  static getTableName() {
    return 'email_campaigns';
  }

  static getFillableFields() {
    return [
      'contact_id',
      'account_id',
      'email_subject',
      'email_template',
      'status',
      'priority',
      'sent_at',
      'sent_by',
      'opened_at',
      'replied_at',
      'communication_started',
      'scheduled_send_at',
      'notes',
      'owner_id',
      'created_by',
      'updated_by'
    ];
  }

  validate() {
    const errors = [];

    if (!this.contactId) {
      errors.push('Contact ID is required');
    }

    if (!this.emailSubject || this.emailSubject.trim() === '') {
      errors.push('Email subject is required');
    }

    if (!this.emailTemplate || this.emailTemplate.trim() === '') {
      errors.push('Email template is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = EmailCampaign;

