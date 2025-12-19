const BaseModel = require('../base/BaseModel');

class Reminder extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.title = data.title || null;
    this.description = data.description || null;
    this.contactId = data.contact_id || data.contactId || null;
    this.accountId = data.account_id || data.accountId || null;
    this.dueDate = data.due_date || data.dueDate || null;
    this.priority = data.priority || 'MEDIUM';
    this.status = data.status || 'PENDING';
    this.completedAt = data.completed_at || data.completedAt || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    this.contact = data.contact || null; // Populated from join
    this.account = data.account || null; // Populated from join
    this.creator = data.creator || null; // Populated from join
  }

  static getTableName() {
    return 'reminders';
  }

  static getFillableFields() {
    return [
      'title',
      'description',
      'contact_id',
      'account_id',
      'due_date',
      'priority',
      'status',
      'completed_at',
      'created_by',
      'updated_by'
    ];
  }

  validate() {
    const errors = [];

    if (!this.title || this.title.trim() === '') {
      errors.push('Reminder title is required');
    }

    if (!this.dueDate) {
      errors.push('Due date is required');
    } else {
      const dueDate = new Date(this.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.push('Invalid due date format');
      }
    }

    if (!this.contactId && !this.accountId) {
      errors.push('Reminder must be tagged to either a contact or an account');
    }

    if (this.contactId && this.accountId) {
      errors.push('Reminder cannot be tagged to both a contact and an account');
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (this.priority && !validPriorities.includes(this.priority)) {
      errors.push('Invalid priority value');
    }

    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push('Invalid status value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Reminder;







