const BaseController = require('../base/BaseController');
const LeadGenerationService = require('../services/LeadGenerationService');
const CompanyProfileService = require('../services/CompanyProfileService');
const { logger } = require('../utils/logger');

class LeadGenerationController extends BaseController {
  /**
   * Analyze company website
   */
  analyzeCompany = this.asyncHandler(async (req, res) => {
    try {
      const { url } = req.body;
      const userId = req.user?.id;

      if (!url) {
        return this.error(res, 'Company URL is required', 400);
      }

      if (!userId) {
        return this.error(res, 'User authentication required', 401);
      }

      const profile = await LeadGenerationService.analyzeCompanyWebsite(url, userId);
      
      return this.success(res, { profile }, 'Company analyzed successfully');
    } catch (error) {
      logger.error('Error analyzing company:', error);
      return this.error(res, error.message || 'Failed to analyze company', 500);
    }
  });

  /**
   * Get company profiles for user
   */
  getProfiles = this.asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id;
      const profiles = await CompanyProfileService.findByUserId(userId);
      
      return this.success(res, { profiles }, 'Profiles retrieved successfully');
    } catch (error) {
      logger.error('Error getting profiles:', error);
      return this.error(res, error.message || 'Failed to get profiles', 500);
    }
  });

  /**
   * Get single profile
   */
  getProfile = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const profile = await CompanyProfileService.findById(id);
      
      if (!profile || profile.userId !== userId) {
        return this.notFound(res, 'Profile not found');
      }
      
      return this.success(res, { profile }, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Error getting profile:', error);
      return this.error(res, error.message || 'Failed to get profile', 500);
    }
  });

  /**
   * Update company profile
   */
  updateProfile = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const profile = await CompanyProfileService.findById(id);
      
      if (!profile || profile.userId !== userId) {
        return this.notFound(res, 'Profile not found');
      }

      const updated = await CompanyProfileService.update(id, updateData, { id: userId });
      
      return this.success(res, { profile: updated }, 'Profile updated successfully');
    } catch (error) {
      logger.error('Error updating profile:', error);
      return this.error(res, error.message || 'Failed to update profile', 500);
    }
  });

  /**
   * Generate leads
   */
  generateLeads = this.asyncHandler(async (req, res) => {
    try {
      const { profileId, options = {} } = req.body;
      const userId = req.user.id;

      if (!profileId) {
        return this.error(res, 'Profile ID is required', 400);
      }

      const profile = await CompanyProfileService.findById(profileId);
      
      if (!profile || profile.userId !== userId) {
        return this.notFound(res, 'Profile not found');
      }

      const leads = await LeadGenerationService.generateLeads(profile, options);
      
      if (leads.length === 0) {
        return this.notFound(
          res,
          'No leads found. Please check your search API configuration (Serper, Google Custom Search, or DuckDuckGo) or adjust your search criteria.'
        );
      }

      return this.success(res, { leads }, 'Leads generated successfully');
    } catch (error) {
      logger.error('Error generating leads:', error);
      return this.error(res, error.message || 'Failed to generate leads', 500);
    }
  });

  /**
   * Import leads
   */
  importLeads = this.asyncHandler(async (req, res) => {
    try {
      const { leads } = req.body;
      const userId = req.user.id;

      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return this.error(res, 'Leads array is required', 400);
      }

      const result = await LeadGenerationService.importLeads(leads, userId);
      
      return this.success(res, result, 'Leads imported successfully');
    } catch (error) {
      logger.error('Error importing leads:', error);
      return this.error(res, error.message || 'Failed to import leads', 500);
    }
  });
}

module.exports = new LeadGenerationController();

