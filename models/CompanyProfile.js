const BaseModel = require('../base/BaseModel');

class CompanyProfile extends BaseModel {
  constructor(data = {}) {
    super(data);
    // Handle both camelCase and snake_case for all fields
    this.userId = data.user_id || data.userId || null;
    this.companyUrl = data.company_url || data.companyUrl || null;
    this.companyName = data.company_name || data.companyName || null;
    this.description = data.description || null;
    this.productsServices = data.products_services || data.productsServices || null;
    this.industry = data.industry || null;
    this.targetMarket = data.target_market || data.targetMarket || null;
    this.companySize = data.company_size || data.companySize || null;
    this.metadata = data.metadata || null;
    
    // Ensure metadata is parsed if it's a string
    if (this.metadata && typeof this.metadata === 'string') {
      try {
        this.metadata = JSON.parse(this.metadata);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
  }

  static getTableName() {
    return 'company_profiles';
  }

  static getFillableFields() {
    return [
      'user_id',
      'company_url',
      'company_name',
      'description',
      'products_services',
      'industry',
      'target_market',
      'company_size',
      'metadata'
    ];
  }

  validate() {
    const errors = [];

    if (!this.companyUrl || this.companyUrl.trim() === '') {
      errors.push('Company URL is required');
    }

    if (this.companyUrl && !this.isValidUrl(this.companyUrl)) {
      errors.push('Invalid company URL format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
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

module.exports = CompanyProfile;

