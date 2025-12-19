const BaseModel = require('../base/BaseModel');

class Proposal extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.title = data.title || null;
    this.description = data.description || null;
    this.opportunityId = data.opportunity_id || data.opportunityId || null;
    this.accountId = data.account_id || data.accountId || null;
    this.contactId = data.contact_id || data.contactId || null;
    this.proposalNumber = data.proposal_number || data.proposalNumber || null;
    this.amount = data.amount || null;
    this.currency = data.currency || 'USD';
    this.validUntil = data.valid_until || data.validUntil || null;
    this.status = data.status || 'DRAFT';
    this.ownerId = data.owner_id || data.ownerId || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    this.opportunity = data.opportunity || null; // Populated from join
    this.account = data.account || null; // Populated from join
    this.contact = data.contact || null; // Populated from join
    this.owner = data.owner || null; // Populated from join
  }

  static getTableName() {
    return 'proposals';
  }

  static getFillableFields() {
    return [
      'title',
      'description',
      'opportunity_id',
      'account_id',
      'contact_id',
      'proposal_number',
      'amount',
      'currency',
      'valid_until',
      'status',
      'owner_id',
      'created_by',
      'updated_by'
    ];
  }

  validate() {
    const errors = [];

    if (!this.title || this.title.trim() === '') {
      errors.push('Proposal title is required');
    }

    const validStatuses = ['DRAFT', 'SENT', 'REVIEWED', 'APPROVED', 'REJECTED', 'ACCEPTED'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push('Invalid status value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Proposal;







