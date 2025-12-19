const BaseController = require('../base/BaseController');
const EmailCampaignService = require('../services/EmailCampaignService');
const { logger } = require('../utils/logger');

class EmailCampaignController extends BaseController {
  constructor() {
    super();
    this.emailCampaignService = new EmailCampaignService();
  }

  /**
   * Get all email campaigns (based on contacts - shows all contacts)
   */
  getAll = this.asyncHandler(async (req, res) => {
    try {
      const ContactService = require('../services/ContactService');
      const contactService = new ContactService();
      
      const {
        page = 1,
        pageSize = 10,
        status,
        priority,
        search,
        orderBy = 'created_at',
        order = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        orderBy: `c.${orderBy}`,
        order: order.toUpperCase(),
        where: '',
        params: []
      };

      // Build where clause
      const conditions = [];
      
      if (status) {
        if (status === 'NO_EMAIL') {
          // Contacts without email template
          conditions.push('(c.email_template IS NULL OR c.email_template = "")');
        } else if (status === 'NOT_CREATED') {
          // Contacts with email template but no campaign record
          conditions.push('(c.email_template IS NOT NULL AND c.email_template != "" AND ec.id IS NULL)');
        } else if (status === 'PENDING') {
          // PENDING: contacts with campaigns that are PENDING, OR contacts with email but no campaign (effectively pending)
          conditions.push('(ec.status = ? OR (ec.id IS NULL AND c.email_template IS NOT NULL AND c.email_template != ""))');
          options.params.push(status);
        } else {
          // For other statuses (SENT, OPENED, REPLIED, etc.), only show contacts that have campaigns with this status
          conditions.push('ec.status = ?');
          options.params.push(status);
        }
      }
      
      if (priority) {
        // For priority filtering
        if (priority === 'MEDIUM') {
          // MEDIUM: contacts with MEDIUM priority OR contacts without campaigns (default to MEDIUM)
          conditions.push('(ec.priority = ? OR ec.priority IS NULL)');
          options.params.push(priority);
        } else {
          // For other priorities (LOW, HIGH, URGENT), only show if campaign exists with that priority
          conditions.push('ec.priority = ?');
          options.params.push(priority);
        }
      }
      
      if (search) {
        conditions.push('(c.email_subject LIKE ? OR c.email LIKE ? OR a.name LIKE ? OR CONCAT(c.first_name, " ", c.last_name) LIKE ?)');
        const searchTerm = `%${search}%`;
        options.params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (conditions.length > 0) {
        options.where = conditions.join(' AND ');
      }

      const currentUser = { id: req.user.id, userId: req.user.id, role: req.user.role };
      const result = await contactService.findWithEmails(options, currentUser);
      
      return this.success(res, result, 'Email campaigns retrieved successfully');
    } catch (error) {
      logger.error('Error getting email campaigns:', error);
      return this.error(res, error.message || 'Failed to get email campaigns', 500);
    }
  });

  /**
   * Get single email campaign (by contact_id)
   */
  getById = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params; // This is contact_id
      const ContactService = require('../services/ContactService');
      const contactService = new ContactService();
      const contact = await contactService.findById(id);

      if (!contact) {
        return this.notFound(res, 'Contact not found');
      }

      // Fetch associated campaign status if exists
      const campaign = await this.emailCampaignService.findByContactId(id);
      contact.campaignStatus = campaign?.status || (contact.emailTemplate ? 'NOT_CREATED' : 'NO_EMAIL');
      contact.campaignPriority = campaign?.priority || 'MEDIUM';
      contact.sentAt = campaign?.sentAt;
      contact.sentBy = campaign?.sentBy;
      contact.communicationStarted = campaign?.communicationStarted || false;
      contact.campaignId = campaign?.id;

      return this.success(res, { campaign: contact }, 'Email campaign retrieved successfully');
    } catch (error) {
      logger.error('Error getting email campaign:', error);
      return this.error(res, error.message || 'Failed to get email campaign', 500);
    }
  });

  /**
   * Auto-generate email and subject for a contact
   */
  generateEmail = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params; // contact_id
      const { companyProfileId } = req.body;
      
      const ContactService = require('../services/ContactService');
      const contactService = new ContactService();
      const QwenService = require('../services/QwenService');
      const CompanyProfileService = require('../services/CompanyProfileService');
      
      // Get contact
      const contact = await contactService.findById(id);
      if (!contact) {
        return this.notFound(res, 'Contact not found');
      }
      
      if (!contact.email) {
        return this.error(res, 'Contact must have an email address to generate email template', 400);
      }
      
      // Get company profile
      let companyProfile = null;
      if (companyProfileId) {
        companyProfile = await CompanyProfileService.findById(companyProfileId);
      } else {
        // Try to get the most recent company profile for this user
        const profiles = await CompanyProfileService.findByUserId(req.user.id);
        if (profiles && profiles.length > 0) {
          // Get the most recent one (first in the list, or you could sort by created_at)
          companyProfile = profiles[0];
        }
      }
      
      if (!companyProfile) {
        return this.error(res, 'Company profile is required. Please create a company profile first or select one.', 400);
      }
      
      // Prepare contact data for email generation
      const emailDomain = contact.email.split('@')[1];
      const contactData = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        emailDomain: emailDomain,
        companyName: contact.account?.name || emailDomain?.split('.')[0] || 'Unknown Company',
        industry: contact.account?.industry || null,
        title: contact.title || null,
      };
      
      // Generate email and subject
      const emailData = await QwenService.generateEmailAndSubject(contactData, companyProfile);
      
      // Clean the subject before saving (remove trailing "0" and whitespace)
      const cleanSubject = (subject) => {
        if (!subject) return '';
        return subject
          .replace(/\s+0+\s*$/gm, '')
          .replace(/\n\s*0+\s*$/gm, '')
          .replace(/\s+$/gm, '')
          .replace(/\n+$/, '')
          .trim();
      };
      
      const cleanedSubject = cleanSubject(emailData.subject);
      
      // Update contact with generated email
      const user = { id: req.user.id, userId: req.user.id };
      const updatedContact = await contactService.update(id, {
        emailTemplate: emailData.email,
        emailSubject: cleanedSubject,
        emailGeneratedAt: new Date(),
      }, user);
      
      return this.success(res, { 
        contact: updatedContact,
        emailSubject: cleanedSubject,
        emailTemplate: emailData.email
      }, 'Email generated successfully');
    } catch (error) {
      logger.error('Error generating email:', error);
      return this.error(res, error.message || 'Failed to generate email', 500);
    }
  });

  /**
   * Create email campaign
   */
  create = this.asyncHandler(async (req, res) => {
    try {
      const user = { id: req.user.id, userId: req.user.id };
      const campaign = await this.emailCampaignService.create(req.body, user);
      
      return this.success(res, { campaign }, 'Email campaign created successfully', 201);
    } catch (error) {
      logger.error('Error creating email campaign:', error);
      return this.error(res, error.message || 'Failed to create email campaign', 500);
    }
  });

  /**
   * Update email campaign
   */
  update = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const user = { id: req.user.id, userId: req.user.id };
      
      const campaign = await this.emailCampaignService.update(id, req.body, user);
      
      return this.success(res, { campaign }, 'Email campaign updated successfully');
    } catch (error) {
      logger.error('Error updating email campaign:', error);
      return this.error(res, error.message || 'Failed to update email campaign', 500);
    }
  });

  /**
   * Mark email as sent (id is contact_id)
   */
  markAsSent = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params; // This is contact_id
      const ContactService = require('../services/ContactService');
      const contactService = new ContactService();
      
      // Get contact to get email info
      const contact = await contactService.findById(id);
      if (!contact) {
        return this.error(res, 'Contact not found', 404);
      }
      
      if (!contact.emailTemplate) {
        return this.error(res, 'Contact has no email template. Please generate one first.', 400);
      }
      
      // Check if campaign exists
      const EmailCampaignRepository = require('../repositories/EmailCampaignRepository');
      const emailCampaignRepo = new EmailCampaignRepository();
      const existingCampaigns = await emailCampaignRepo.query(
        'SELECT * FROM email_campaigns WHERE contact_id = ? AND deleted_at IS NULL LIMIT 1',
        [id]
      );
      
      let campaign;
      if (existingCampaigns.length > 0) {
        // Update existing campaign
        campaign = await this.emailCampaignService.markAsSent(existingCampaigns[0].id, req.user.id);
      } else {
        // Create new campaign and mark as sent
        const campaignData = {
          contactId: id,
          accountId: contact.accountId,
          emailSubject: contact.emailSubject,
          emailTemplate: contact.emailTemplate,
          status: 'SENT',
          priority: 'MEDIUM',
          ownerId: req.user.id,
          createdBy: req.user.id,
        };
        campaign = await this.emailCampaignService.create(campaignData, { id: req.user.id, userId: req.user.id });
      }
      
      return this.success(res, { campaign, contact }, 'Email marked as sent successfully');
    } catch (error) {
      logger.error('Error marking email as sent:', error);
      return this.error(res, error.message || 'Failed to mark email as sent', 500);
    }
  });

  /**
   * Toggle communication started (id is contact_id)
   */
  toggleCommunicationStarted = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params; // This is contact_id
      const { started } = req.body;
      
      const ContactService = require('../services/ContactService');
      const contactService = new ContactService();
      
      // Get contact
      const contact = await contactService.findById(id);
      if (!contact) {
        return this.error(res, 'Contact not found', 404);
      }
      
      // Check if campaign exists
      const EmailCampaignRepository = require('../repositories/EmailCampaignRepository');
      const emailCampaignRepo = new EmailCampaignRepository();
      const existingCampaigns = await emailCampaignRepo.query(
        'SELECT * FROM email_campaigns WHERE contact_id = ? AND deleted_at IS NULL LIMIT 1',
        [id]
      );
      
      let campaign;
      if (existingCampaigns.length > 0) {
        campaign = await this.emailCampaignService.toggleCommunicationStarted(
          existingCampaigns[0].id,
          started === true || started === 'true',
          req.user.id
        );
      } else {
        // Create new campaign
        if (!contact.emailTemplate) {
          return this.error(res, 'Contact has no email template. Please generate one first.', 400);
        }
        const campaignData = {
          contactId: id,
          accountId: contact.accountId,
          emailSubject: contact.emailSubject,
          emailTemplate: contact.emailTemplate,
          status: started ? 'SENT' : 'PENDING',
          priority: 'MEDIUM',
          communicationStarted: started === true || started === 'true',
          ownerId: req.user.id,
          createdBy: req.user.id,
        };
        campaign = await this.emailCampaignService.create(campaignData, { id: req.user.id, userId: req.user.id });
      }
      
      return this.success(res, { campaign, contact }, 'Communication status updated successfully');
    } catch (error) {
      logger.error('Error toggling communication started:', error);
      return this.error(res, error.message || 'Failed to update communication status', 500);
    }
  });

  /**
   * Get analytics
   */
  getAnalytics = this.asyncHandler(async (req, res) => {
    try {
      const userId = req.user.role?.name === 'ADMIN' || req.user.role?.name === 'SUPER_ADMIN' 
        ? null 
        : req.user.id;
      
      const analytics = await this.emailCampaignService.getAnalytics(userId);
      
      return this.success(res, { analytics }, 'Analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting analytics:', error);
      return this.error(res, error.message || 'Failed to get analytics', 500);
    }
  });

  /**
   * Get urgent recommendations
   */
  getUrgentRecommendations = this.asyncHandler(async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const userId = req.user.role?.name === 'ADMIN' || req.user.role?.name === 'SUPER_ADMIN' 
        ? null 
        : req.user.id;
      
      const recommendations = await this.emailCampaignService.getUrgentRecommendations(
        userId, 
        parseInt(limit)
      );
      
      return this.success(res, { recommendations }, 'Urgent recommendations retrieved successfully');
    } catch (error) {
      logger.error('Error getting urgent recommendations:', error);
      return this.error(res, error.message || 'Failed to get urgent recommendations', 500);
    }
  });

  /**
   * Bulk mark as sent
   */
  bulkMarkAsSent = this.asyncHandler(async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return this.error(res, 'IDs array is required', 400);
      }
      
      const results = await this.emailCampaignService.bulkMarkAsSent(ids, req.user.id);
      
      return this.success(res, { results }, 'Bulk mark as sent completed');
    } catch (error) {
      logger.error('Error in bulk mark as sent:', error);
      return this.error(res, error.message || 'Failed to bulk mark as sent', 500);
    }
  });

  /**
   * Delete email campaign
   */
  delete = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const user = { id: req.user.id, userId: req.user.id };
      
      await this.emailCampaignService.delete(id, user);
      
      return this.success(res, null, 'Email campaign deleted successfully');
    } catch (error) {
      logger.error('Error deleting email campaign:', error);
      return this.error(res, error.message || 'Failed to delete email campaign', 500);
    }
  });
}

module.exports = new EmailCampaignController();
