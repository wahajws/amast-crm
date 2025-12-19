const BaseModel = require('../base/BaseModel');

class Account extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.name = data.name || null;
    this.industry = data.industry || null;
    this.website = data.website || null;
    this.phone = data.phone || null;
    this.email = data.email || null;
    this.billingStreet = data.billing_street || data.billingStreet || null;
    this.billingCity = data.billing_city || data.billingCity || null;
    this.billingState = data.billing_state || data.billingState || null;
    this.billingPostalCode = data.billing_postal_code || data.billingPostalCode || null;
    this.billingCountry = data.billing_country || data.billingCountry || null;
    this.shippingStreet = data.shipping_street || data.shippingStreet || null;
    this.shippingCity = data.shipping_city || data.shippingCity || null;
    this.shippingState = data.shipping_state || data.shippingState || null;
    this.shippingPostalCode = data.shipping_postal_code || data.shippingPostalCode || null;
    this.shippingCountry = data.shipping_country || data.shippingCountry || null;
    this.description = data.description || null;
    this.annualRevenue = data.annual_revenue || data.annualRevenue || null;
    this.numberOfEmployees = data.number_of_employees || data.numberOfEmployees || null;
    this.ownerId = data.owner_id || data.ownerId || null;
    this.status = data.status || 'ACTIVE';
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    this.owner = data.owner || null; // Populated from join
  }

  static getTableName() {
    return 'accounts';
  }

  static getFillableFields() {
    return [
      'name',
      'industry',
      'website',
      'phone',
      'email',
      'billing_street',
      'billing_city',
      'billing_state',
      'billing_postal_code',
      'billing_country',
      'shipping_street',
      'shipping_city',
      'shipping_state',
      'shipping_postal_code',
      'shipping_country',
      'description',
      'annual_revenue',
      'number_of_employees',
      'owner_id',
      'status',
      'created_by',
      'updated_by'
    ];
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Account name is required');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    if (this.website && !this.isValidUrl(this.website)) {
      errors.push('Invalid website URL format');
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

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = Account;







