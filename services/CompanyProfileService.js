const BaseService = require('../base/BaseService');
const CompanyProfileRepository = require('../repositories/CompanyProfileRepository');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');

class CompanyProfileService extends BaseService {
  constructor() {
    super(new CompanyProfileRepository());
  }

  async create(data, user = null) {
    try {
      // Ensure user_id is set from user parameter or data
      const userId = user?.id || data.userId || data.user_id;
      if (!userId) {
        throw new Error('User ID is required to create company profile');
      }

      // Normalize data - ensure user_id and company_url are set
      data.user_id = userId;
      data.userId = userId; // Keep both for compatibility
      
      // Normalize company_url
      const companyUrl = data.companyUrl || data.company_url;
      if (companyUrl) {
        data.company_url = companyUrl;
        data.companyUrl = companyUrl;
      }

      // Check if profile already exists for this URL and user
      if (companyUrl && userId) {
        const existing = await this.repository.findByUrl(companyUrl, userId);
        if (existing) {
          // Update existing profile
          return await this.update(existing.id, data, user);
        }
      }

      // Map to snake_case for database
      const mappedData = mapToSnakeCase(data);
      
      // Handle metadata JSON - ensure it's stringified for database
      if (mappedData.metadata) {
        if (typeof mappedData.metadata === 'object') {
          mappedData.metadata = JSON.stringify(mappedData.metadata);
        }
        // If it's already a string, keep it as is
      }

      const profile = await this.repository.create(mappedData);
      logger.info(`Company profile created: ${profile.id}`);
      
      // Ensure profile is returned with camelCase properties
      return profile;
    } catch (error) {
      logger.error('Error creating company profile:', error);
      throw error;
    }
  }

  async findByUserId(userId) {
    try {
      return await this.repository.findByUserId(userId);
    } catch (error) {
      logger.error('Error finding company profiles by user:', error);
      throw error;
    }
  }

  async findByUrl(companyUrl, userId) {
    try {
      return await this.repository.findByUrl(companyUrl, userId);
    } catch (error) {
      logger.error('Error finding company profile by URL:', error);
      throw error;
    }
  }

  async update(id, data, user = null) {
    try {
      // Normalize data - handle both camelCase and snake_case
      const normalizedData = { ...data };
      
      // Normalize company_url
      if (normalizedData.companyUrl || normalizedData.company_url) {
        const companyUrl = normalizedData.companyUrl || normalizedData.company_url;
        normalizedData.company_url = companyUrl;
        normalizedData.companyUrl = companyUrl;
      }

      // Map to snake_case for database
      const mappedData = mapToSnakeCase(normalizedData);
      
      // Handle metadata JSON - ensure it's stringified for database
      if (mappedData.metadata) {
        if (typeof mappedData.metadata === 'object') {
          mappedData.metadata = JSON.stringify(mappedData.metadata);
        }
        // If it's already a string, keep it as is
      }

      // Call parent update method with mapped data
      return await super.update(id, mappedData, user);
    } catch (error) {
      logger.error('Error updating company profile:', error);
      throw error;
    }
  }
}

module.exports = new CompanyProfileService();

