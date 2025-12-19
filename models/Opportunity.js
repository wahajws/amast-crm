const BaseModel = require('../base/BaseModel');

class Opportunity extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.name = data.name || null;
    this.description = data.description || null;
    this.accountId = data.account_id || data.accountId || null;
    this.contactId = data.contact_id || data.contactId || null;
    this.stage = data.stage || 'PROSPECTING';
    this.probability = data.probability || 0;
    this.amount = data.amount || null;
    this.expectedCloseDate = data.expected_close_date || data.expectedCloseDate || null;
    this.actualCloseDate = data.actual_close_date || data.actualCloseDate || null;
    this.ownerId = data.owner_id || data.ownerId || null;
    this.status = data.status || 'ACTIVE';
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    this.account = data.account || null; // Populated from join
    this.contact = data.contact || null; // Populated from join
    this.owner = data.owner || null; // Populated from join
  }

  static getTableName() {
    return 'opportunities';
  }

  static getFillableFields() {
    return [
      'name',
      'description',
      'account_id',
      'contact_id',
      'stage',
      'probability',
      'amount',
      'expected_close_date',
      'actual_close_date',
      'owner_id',
      'status',
      'created_by',
      'updated_by'
    ];
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Opportunity name is required');
    }

    if (this.probability !== null && (this.probability < 0 || this.probability > 100)) {
      errors.push('Probability must be between 0 and 100');
    }

    const validStages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    if (this.stage && !validStages.includes(this.stage)) {
      errors.push('Invalid stage value');
    }

    const validStatuses = ['ACTIVE', 'WON', 'LOST', 'CANCELLED'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push('Invalid status value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Opportunity;







