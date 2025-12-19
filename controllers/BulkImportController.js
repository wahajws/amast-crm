const BaseController = require('../base/BaseController');
const BulkImportService = require('../services/BulkImportService');
const CompanyProfileService = require('../services/CompanyProfileService');
const { logger } = require('../utils/logger');

class BulkImportController extends BaseController {
  /**
   * Process bulk import from uploaded file
   */
  processBulkImport = this.asyncHandler(async (req, res) => {
    try {
      const { companyProfileId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return this.error(res, 'User authentication required', 401);
      }

      if (!companyProfileId) {
        return this.error(res, 'Company profile ID is required', 400);
      }

      if (!req.file) {
        return this.error(res, 'Excel file is required', 400);
      }

      logger.info(`Bulk import started by user ${userId} with profile ${companyProfileId}`);

      const results = await BulkImportService.processBulkImport(
        req.file.buffer,
        companyProfileId,
        userId
      );

      return this.success(res, results, 'Bulk import completed successfully');
    } catch (error) {
      logger.error('Error in bulk import:', error);
      return this.error(res, error.message || 'Failed to process bulk import', 500);
    }
  });

  /**
   * Get company profiles for selection
   */
  getCompanyProfiles = this.asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id;
      const profiles = await CompanyProfileService.findByUserId(userId);
      
      return this.success(res, { profiles }, 'Profiles retrieved successfully');
    } catch (error) {
      logger.error('Error getting profiles:', error);
      return this.error(res, error.message || 'Failed to get profiles', 500);
    }
  });
}

module.exports = new BulkImportController();

