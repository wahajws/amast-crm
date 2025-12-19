const BaseController = require('../base/BaseController');
const EmailRepository = require('../repositories/EmailRepository');
const EmailAttachmentRepository = require('../repositories/EmailAttachmentRepository');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');

class EmailController extends BaseController {
  constructor() {
    super();
    this.emailRepo = new EmailRepository();
    this.attachmentRepo = new EmailAttachmentRepository();
  }

  /**
   * GET /api/emails
   * Get all emails with pagination and filters
   */
  index = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { page, pageSize } = this.getPaginationParams(req);
    
    const options = {
      page,
      pageSize,
      orderBy: 'e.received_at',
      order: 'DESC',
      userId: currentUser.userId || currentUser.id,
      where: '',
      params: []
    };

    // Add filters
    if (req.query.contactId) {
      options.where = 'e.contact_id = ?';
      options.params = [req.query.contactId];
    } else if (req.query.accountId) {
      options.where = 'e.account_id = ?';
      options.params = [req.query.accountId];
    } else if (req.query.unlinked === 'true') {
      options.where = 'e.contact_id IS NULL AND e.account_id IS NULL';
      options.params = [];
    }

    // Search
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      if (options.where) {
        options.where += ' AND (e.subject LIKE ? OR e.from_email LIKE ? OR e.body_text LIKE ?)';
      } else {
        options.where = '(e.subject LIKE ? OR e.from_email LIKE ? OR e.body_text LIKE ?)';
      }
      options.params = [...options.params, searchTerm, searchTerm, searchTerm];
    }

    try {
      const result = await this.emailRepo.findAll(options);
      return this.success(res, result);
    } catch (error) {
      logger.error('Error fetching emails:', error);
      logger.error('Error stack:', error.stack);
      logger.error('Options:', JSON.stringify(options, null, 2));
      return this.serverError(res, `Failed to fetch emails: ${error.message}`, error);
    }
  });

  /**
   * GET /api/emails/:id
   * Get single email with full details
   */
  show = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { id } = req.params;

    try {
      const email = await this.emailRepo.findById(id);
      if (!email) {
        return this.notFound(res, 'Email not found');
      }

      // Check if email belongs to user
      const userId = currentUser.userId || currentUser.id;
      if (email.userId !== userId) {
        return this.forbidden(res, 'You can only access your own emails');
      }

      // Get attachments
      const attachments = await this.attachmentRepo.findByEmailId(id);
      email.attachments = attachments;

      return this.success(res, email);
    } catch (error) {
      logger.error('Error fetching email:', error);
      return this.serverError(res, 'Failed to fetch email', error);
    }
  });

  /**
   * GET /api/emails/thread/:threadId
   * Get email thread/conversation
   */
  getThread = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { threadId } = req.params;

    try {
      const userId = currentUser.userId || currentUser.id;
      const emails = await this.emailRepo.findByThreadId(threadId, userId);
      return this.success(res, emails);
    } catch (error) {
      logger.error('Error fetching email thread:', error);
      return this.serverError(res, 'Failed to fetch email thread', error);
    }
  });

  /**
   * PUT /api/emails/:id
   * Update email (read status, starred, etc.)
   */
  update = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { id } = req.params;

    try {
      const email = await this.emailRepo.findById(id);
      if (!email) {
        return this.notFound(res, 'Email not found');
      }

      const userId = currentUser.userId || currentUser.id;
      if (email.userId !== userId) {
        return this.forbidden(res, 'You can only update your own emails');
      }

      const updateData = {};
      if (req.body.isRead !== undefined) updateData.isRead = req.body.isRead;
      if (req.body.isStarred !== undefined) updateData.isStarred = req.body.isStarred;

      const updated = await this.emailRepo.update(id, mapToSnakeCase(updateData));
      return this.success(res, updated, 'Email updated successfully');
    } catch (error) {
      logger.error('Error updating email:', error);
      return this.serverError(res, 'Failed to update email', error);
    }
  });

  /**
   * POST /api/emails/:id/link
   * Manually link email to contact or account
   */
  linkEmail = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { id } = req.params;
    let { contactId, accountId } = req.body;

    try {
      // Convert to integers if provided as strings
      if (contactId) contactId = parseInt(contactId, 10);
      if (accountId) accountId = parseInt(accountId, 10);

      // Validate that at least one is provided
      if (!contactId && !accountId) {
        return this.error(res, 'Either contactId or accountId must be provided', 400);
      }

      const email = await this.emailRepo.findById(id);
      if (!email) {
        return this.notFound(res, 'Email not found');
      }

      const userId = currentUser.userId || currentUser.id;
      if (email.userId !== userId) {
        return this.forbidden(res, 'You can only link your own emails');
      }

      const updateData = {};
      if (contactId) updateData.contactId = contactId;
      if (accountId) updateData.accountId = accountId;

      // If linking to a contact, also try to link to their account
      if (contactId && !accountId) {
        const ContactRepository = require('../repositories/ContactRepository');
        const contactRepo = new ContactRepository();
        const contact = await contactRepo.findById(contactId);
        if (contact && contact.accountId) {
          updateData.accountId = contact.accountId;
        }
      }

      await this.emailRepo.update(id, mapToSnakeCase(updateData));
      
      // Fetch updated email with relationships
      const updatedEmail = await this.emailRepo.findById(id);
      return this.success(res, updatedEmail, 'Email linked successfully');
    } catch (error) {
      logger.error('Error linking email:', error);
      logger.error('Error details:', { id, contactId, accountId, error: error.message });
      return this.serverError(res, `Failed to link email: ${error.message}`, error);
    }
  });

  /**
   * GET /api/emails/unlinked
   * Get unlinked emails
   */
  getUnlinked = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const limit = parseInt(req.query.limit) || 50;

    try {
      const userId = currentUser.userId || currentUser.id;
      const emails = await this.emailRepo.getUnlinkedEmails(userId, limit);
      return this.success(res, emails);
    } catch (error) {
      logger.error('Error fetching unlinked emails:', error);
      return this.serverError(res, 'Failed to fetch unlinked emails', error);
    }
  });

  /**
   * DELETE /api/emails/:id
   * Soft delete email
   */
  destroy = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { id } = req.params;

    try {
      const email = await this.emailRepo.findById(id);
      if (!email) {
        return this.notFound(res, 'Email not found');
      }

      const userId = currentUser.userId || currentUser.id;
      if (email.userId !== userId) {
        return this.forbidden(res, 'You can only delete your own emails');
      }

      await this.emailRepo.delete(id);
      return this.noContent(res);
    } catch (error) {
      logger.error('Error deleting email:', error);
      return this.serverError(res, 'Failed to delete email', error);
    }
  });

  /**
   * GET /api/emails/by-account/:accountId
   * Get emails for an account with smart domain matching
   * Intelligently matches emails by domain even if account name has spaces
   */
  getByAccount = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { accountId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    try {
      const userId = currentUser.userId || currentUser.id;
      
      // Get account details
      const AccountRepository = require('../repositories/AccountRepository');
      const accountRepo = new AccountRepository();
      const account = await accountRepo.findById(accountId);
      
      if (!account) {
        return this.notFound(res, 'Account not found');
      }

      // Get emails directly linked to account
      const linkedEmails = await this.emailRepo.findByAccountId(accountId, userId);

      // Smart domain matching: Extract domain from account name
      // Account name may have spaces (e.g., "AMAST Solutions")
      // Email domains never have spaces (e.g., "@amast.com.my")
      const accountNameWords = account.name.toLowerCase().split(/\s+/);
      const primaryWord = accountNameWords[0]; // First word is usually the domain base
      
      // Also try to get domain from account website if available
      let domainPatterns = [];
      if (account.website) {
        try {
          const url = new URL(account.website.startsWith('http') ? account.website : `https://${account.website}`);
          const hostname = url.hostname.replace('www.', '');
          domainPatterns.push(hostname);
        } catch (e) {
          // Invalid URL, skip
        }
      }
      
      // Add primary word as potential domain
      domainPatterns.push(primaryWord);

      // Get all emails for user to match by domain
      const allEmails = await this.emailRepo.findAll({
        page: 1,
        pageSize: 10000, // Get all emails for domain matching
        userId,
        where: '',
        params: []
      });

      // Match emails by domain
      const domainMatchedEmails = allEmails.data.filter(email => {
        if (!email.fromEmail) return false;
        
        // Extract domain from email
        const emailDomain = email.fromEmail.split('@')[1]?.toLowerCase();
        if (!emailDomain) return false;

        // Check if email domain matches any pattern
        return domainPatterns.some(pattern => {
          // Exact match
          if (emailDomain === pattern) return true;
          // Contains pattern (e.g., "amast" matches "amast.com.my")
          if (emailDomain.includes(pattern)) return true;
          // Pattern contains domain base (e.g., "amast.com.my" contains "amast")
          if (pattern.includes(emailDomain.split('.')[0])) return true;
          return false;
        });
      });

      // Combine linked and domain-matched emails, remove duplicates
      const emailMap = new Map();
      [...linkedEmails, ...domainMatchedEmails].forEach(email => {
        if (!emailMap.has(email.id)) {
          emailMap.set(email.id, email);
        }
      });

      // Sort by received date (newest first)
      const allEmailsList = Array.from(emailMap.values()).sort((a, b) => {
        const dateA = a.receivedAt ? new Date(a.receivedAt) : new Date(0);
        const dateB = b.receivedAt ? new Date(b.receivedAt) : new Date(0);
        return dateB - dateA;
      });

      // Paginate
      const pageNum = parseInt(page, 10);
      const pageSizeNum = parseInt(pageSize, 10);
      const start = (pageNum - 1) * pageSizeNum;
      const end = start + pageSizeNum;
      const paginatedEmails = allEmailsList.slice(start, end);

      return this.success(res, {
        data: paginatedEmails,
        total: allEmailsList.length,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(allEmailsList.length / pageSizeNum),
        account: {
          id: account.id,
          name: account.name,
          website: account.website
        }
      });
    } catch (error) {
      logger.error('Error fetching emails by account:', error);
      return this.serverError(res, 'Failed to fetch emails by account', error);
    }
  });

  /**
   * GET /api/emails/timeline/:accountId
   * Get chronological email timeline for an account
   */
  getTimeline = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { accountId } = req.params;

    try {
      const userId = currentUser.userId || currentUser.id;
      
      // Get account details
      const AccountRepository = require('../repositories/AccountRepository');
      const accountRepo = new AccountRepository();
      const account = await accountRepo.findById(accountId);
      
      if (!account) {
        return this.notFound(res, 'Account not found');
      }

      // Get all emails for this account (using the same smart matching logic)
      const linkedEmails = await this.emailRepo.findByAccountId(accountId, userId);

      // Smart domain matching
      const accountNameWords = account.name.toLowerCase().split(/\s+/);
      const primaryWord = accountNameWords[0];
      
      let domainPatterns = [];
      if (account.website) {
        try {
          const url = new URL(account.website.startsWith('http') ? account.website : `https://${account.website}`);
          const hostname = url.hostname.replace('www.', '');
          domainPatterns.push(hostname);
        } catch (e) {
          // Invalid URL, skip
        }
      }
      domainPatterns.push(primaryWord);

      const allEmails = await this.emailRepo.findAll({
        page: 1,
        pageSize: 10000,
        userId,
        where: '',
        params: []
      });

      const domainMatchedEmails = allEmails.data.filter(email => {
        if (!email.fromEmail) return false;
        const emailDomain = email.fromEmail.split('@')[1]?.toLowerCase();
        if (!emailDomain) return false;
        return domainPatterns.some(pattern => {
          if (emailDomain === pattern) return true;
          if (emailDomain.includes(pattern)) return true;
          if (pattern.includes(emailDomain.split('.')[0])) return true;
          return false;
        });
      });

      // Combine and remove duplicates
      const emailMap = new Map();
      [...linkedEmails, ...domainMatchedEmails].forEach(email => {
        if (!emailMap.has(email.id)) {
          emailMap.set(email.id, email);
        }
      });

      // Group by thread and sort chronologically
      const threadMap = new Map();
      Array.from(emailMap.values()).forEach(email => {
        const threadId = email.threadId || `single-${email.id}`;
        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, []);
        }
        threadMap.get(threadId).push(email);
      });

      // Sort threads by most recent email, then sort emails within thread
      const timeline = Array.from(threadMap.entries())
        .map(([threadId, emails]) => {
          // Sort emails in thread by date
          emails.sort((a, b) => {
            const dateA = a.receivedAt ? new Date(a.receivedAt) : new Date(0);
            const dateB = b.receivedAt ? new Date(b.receivedAt) : new Date(0);
            return dateA - dateB; // Oldest first within thread
          });
          return {
            threadId,
            emails,
            latestDate: emails[emails.length - 1]?.receivedAt || emails[0]?.receivedAt
          };
        })
        .sort((a, b) => {
          const dateA = a.latestDate ? new Date(a.latestDate) : new Date(0);
          const dateB = b.latestDate ? new Date(b.latestDate) : new Date(0);
          return dateB - dateA; // Newest threads first
        });

      return this.success(res, {
        timeline,
        account: {
          id: account.id,
          name: account.name,
          website: account.website
        }
      });
    } catch (error) {
      logger.error('Error fetching email timeline:', error);
      return this.serverError(res, 'Failed to fetch email timeline', error);
    }
  });

  /**
   * POST /api/emails/:id/reply
   * Send a reply to an email
   */
  sendReply = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { id } = req.params;
    const { body, subject, attachments, signature, initials } = req.body;

    try {
      const userId = currentUser.userId || currentUser.id;
      
      // Get original email
      const originalEmail = await this.emailRepo.findById(id);
      if (!originalEmail) {
        return this.notFound(res, 'Email not found');
      }

      if (originalEmail.userId !== userId) {
        return this.forbidden(res, 'You can only reply to your own emails');
      }

      // Get user with Gmail tokens
      const UserRepository = require('../repositories/UserRepository');
      const userRepo = new UserRepository();
      const user = await userRepo.findById(userId);
      
      if (!user.gmailAccessToken) {
        return this.error(res, 'Gmail account not connected', 400);
      }

      // Build reply body with signature/initials
      let replyBody = body || '';
      if (signature) {
        replyBody += `\n\n${signature}`;
      }
      if (initials) {
        replyBody += `\n\n${initials}`;
      }

      // Send reply via Gmail API
      const GmailService = require('../services/GmailService');
      const gmailService = new GmailService();
      const gmail = await gmailService.getAuthenticatedClient(user);

      // Build reply message
      const replyTo = originalEmail.fromEmail;
      const replySubject = subject || (originalEmail.subject?.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject || ''}`);
      
      // Create message
      const messageParts = [
        `To: ${replyTo}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${originalEmail.gmailMessageId}`,
        `References: ${originalEmail.gmailMessageId}`,
        '',
        replyBody
      ];

      // Handle attachments if provided
      // Note: This is a simplified version. Full implementation would handle file uploads
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          threadId: originalEmail.threadId,
          raw: encodedMessage
        }
      });

      // Store sent email in database (optional - you might want to sync it)
      logger.info(`Reply sent for email ${id}, Gmail message ID: ${result.data.id}`);

      return this.success(res, {
        messageId: result.data.id,
        threadId: originalEmail.threadId
      }, 'Reply sent successfully');
    } catch (error) {
      logger.error('Error sending reply:', error);
      
      // Check if it's a scope/permission error
      if (error.code === 403 && error.message?.includes('insufficient') || error.message?.includes('Permission')) {
        return this.error(res, 'Gmail send permission not granted. Please log out and log back in with Gmail to grant send permissions.', 403);
      }
      
      return this.serverError(res, `Failed to send reply: ${error.message}`, error);
    }
  });
}

module.exports = EmailController;

