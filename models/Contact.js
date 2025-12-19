const BaseModel = require('../base/BaseModel');

class Contact extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.firstName = data.first_name || data.firstName || null;
    this.lastName = data.last_name || data.lastName || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.mobile = data.mobile || null;
    this.title = data.title || null;
    this.department = data.department || null;
    this.accountId = data.account_id || data.accountId || null;
    this.mailingStreet = data.mailing_street || data.mailingStreet || null;
    this.mailingCity = data.mailing_city || data.mailingCity || null;
    this.mailingState = data.mailing_state || data.mailingState || null;
    this.mailingPostalCode = data.mailing_postal_code || data.mailingPostalCode || null;
    this.mailingCountry = data.mailing_country || data.mailingCountry || null;
    this.description = data.description || null;
    this.emailTemplate = data.email_template || data.emailTemplate || null;
    this.emailSubject = data.email_subject || data.emailSubject || null;
    this.emailGeneratedAt = data.email_generated_at || data.emailGeneratedAt || null;
    this.ownerId = data.owner_id || data.ownerId || null;
    this.status = data.status || 'ACTIVE';
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    this.account = data.account || null; // Populated from join
    this.owner = data.owner || null; // Populated from join
  }

  static getTableName() {
    return 'contacts';
  }

  static getFillableFields() {
    return [
      'first_name',
      'last_name',
      'email',
      'phone',
      'mobile',
      'title',
      'department',
      'account_id',
      'mailing_street',
      'mailing_city',
      'mailing_state',
      'mailing_postal_code',
      'mailing_country',
      'description',
      'email_template',
      'email_subject',
      'email_generated_at',
      'owner_id',
      'status',
      'created_by',
      'updated_by'
    ];
  }

  validate() {
    const errors = [];

    if (!this.firstName || this.firstName.trim() === '') {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim() === '') {
      errors.push('Last name is required');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Contact;







