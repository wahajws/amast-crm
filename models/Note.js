const BaseModel = require('../base/BaseModel');

class Note extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.title = data.title || null;
    this.content = data.content || null;
    this.contactId = data.contact_id || data.contactId || null;
    this.accountId = data.account_id || data.accountId || null;
    this.reminderDate = data.reminder_date || data.reminderDate || null;
    this.reminderStatus = data.reminder_status || data.reminderStatus || null;
    this.reminderCompletedAt = data.reminder_completed_at || data.reminderCompletedAt || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    this.contact = data.contact || null; // Populated from join
    this.account = data.account || null; // Populated from join
    this.creator = data.creator || null; // Populated from join
  }

  static getTableName() {
    return 'notes';
  }

  static getFillableFields() {
    return [
      'title',
      'content',
      'contact_id',
      'account_id',
      'reminder_date',
      'reminder_status',
      'reminder_completed_at',
      'created_by',
      'updated_by'
    ];
  }

  validate() {
    const errors = [];

    if (!this.title || this.title.trim() === '') {
      errors.push('Note title is required');
    }

    if (!this.content || this.content.trim() === '') {
      errors.push('Note content is required');
    }

    if (!this.contactId && !this.accountId) {
      errors.push('Note must be tagged to either a contact or an account');
    }

    if (this.contactId && this.accountId) {
      errors.push('Note cannot be tagged to both a contact and an account');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Note;



