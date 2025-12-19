const GmailService = require('./GmailService');
const EmailRepository = require('../repositories/EmailRepository');
const EmailAttachmentRepository = require('../repositories/EmailAttachmentRepository');
const EmailSyncLogRepository = require('../repositories/EmailSyncLogRepository');
const ContactRepository = require('../repositories/ContactRepository');
const AccountRepository = require('../repositories/AccountRepository');
const GmailLabelSyncRepository = require('../repositories/GmailLabelSyncRepository');
const { logger } = require('../utils/logger');
const { mapToSnakeCase } = require('../utils/fieldMapper');

class EmailSyncService {
  constructor() {
    this.gmailService = new GmailService();
    this.emailRepo = new EmailRepository();
    this.attachmentRepo = new EmailAttachmentRepository();
    this.syncLogRepo = new EmailSyncLogRepository();
    this.contactRepo = new ContactRepository();
    this.accountRepo = new AccountRepository();
    this.labelSyncRepo = new GmailLabelSyncRepository();
  }

  /**
   * Sync emails from a specific label
   */
  async syncLabelEmails(user, labelId, syncType = 'manual') {
    let emailsSynced = 0;
    let emailsSkipped = 0;
    let errorMessage = null;
    const startTime = new Date();

    try {
      // Get label info
      const label = await this.labelSyncRepo.findByUserIdAndLabelId(user.id, labelId);
      if (!label) {
        throw new Error('Label not found in sync settings');
      }

      // Get emails from Gmail API
      let pageToken = null;
      let hasMore = true;
      const maxResults = 50;

      while (hasMore) {
        const result = await this.gmailService.getEmailsFromLabel(
          user,
          labelId,
          maxResults,
          pageToken
        );

        const messages = result.messages || [];
        pageToken = result.nextPageToken;
        hasMore = !!pageToken && messages.length > 0;

        // Process each email
        for (const message of messages) {
          try {
            const emailExists = await this.emailRepo.findByGmailMessageId(message.id);
            if (emailExists) {
              emailsSkipped++;
              continue; // Skip duplicates
            }

            // Get full email details
            const emailData = await this.gmailService.getEmailMessage(user, message.id);
            const email = await this.parseEmailData(emailData, user.id);

            // Match email to contact/account (pass label name for smart matching)
            await this.matchEmailToContactOrAccount(email, user.id, label.labelName);

            // Save email
            const savedEmail = await this.emailRepo.create(mapToSnakeCase(email));
            emailsSynced++;

            // Process attachments
            if (email.attachmentCount > 0) {
              await this.processAttachments(user, message.id, savedEmail.id, emailData);
            }
          } catch (error) {
            logger.error(`Error processing email ${message.id}:`, error);
            // Continue with next email
          }
        }

        // If no more pages, break
        if (!hasMore) {
          break;
        }
      }

      // Update last synced time
      await this.labelSyncRepo.updateLastSyncedAt(user.id, labelId);

      // Log success
      await this.syncLogRepo.createLog({
        userId: user.id,
        labelId: labelId,
        syncType: syncType,
        status: 'success',
        emailsSynced: emailsSynced,
        emailsSkipped: emailsSkipped,
        errorMessage: null
      });

      return {
        success: true,
        emailsSynced,
        emailsSkipped
      };
    } catch (error) {
      errorMessage = error.message;
      logger.error(`Error syncing emails for user ${user.id}, label ${labelId}:`, error);

      // Log failure
      await this.syncLogRepo.createLog({
        userId: user.id,
        labelId: labelId,
        syncType: syncType,
        status: 'failed',
        emailsSynced: emailsSynced,
        emailsSkipped: emailsSkipped,
        errorMessage: errorMessage
      });

      throw error;
    }
  }

  /**
   * Sync all labels that user has selected to sync
   */
  async syncAllLabels(user, syncType = 'manual') {
    const syncingLabels = await this.labelSyncRepo.getSyncingLabels(user.id);
    const results = [];

    for (const label of syncingLabels) {
      try {
        const result = await this.syncLabelEmails(user, label.labelId, syncType);
        results.push({
          labelId: label.labelId,
          labelName: label.labelName,
          ...result
        });
      } catch (error) {
        results.push({
          labelId: label.labelId,
          labelName: label.labelName,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Parse Gmail message data into Email model
   */
  async parseEmailData(gmailMessage, userId) {
    const headers = gmailMessage.payload.headers || [];
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : null;
    };

    // Parse email addresses
    const parseEmailAddress = (str) => {
      if (!str) return null;
      const match = str.match(/([^<]+)?\s*<([^>]+)>/);
      if (match) {
        return {
          name: match[1] ? match[1].trim() : null,
          email: match[2].trim()
        };
      }
      return {
        name: null,
        email: str.trim()
      };
    };

    const from = parseEmailAddress(getHeader('From'));
    const to = getHeader('To') ? getHeader('To').split(',').map(parseEmailAddress) : [];
    const cc = getHeader('Cc') ? getHeader('Cc').split(',').map(parseEmailAddress) : [];
    const bcc = getHeader('Bcc') ? getHeader('Bcc').split(',').map(parseEmailAddress) : [];

    // Get body content
    const bodyContent = { text: '', html: '' };
    this.extractBody(gmailMessage.payload, bodyContent);

    // Get attachments count
    const attachmentCounter = { count: 0 };
    this.countAttachments(gmailMessage.payload, attachmentCounter);

    // Parse dates
    const dateHeader = getHeader('Date');
    const receivedAt = dateHeader ? new Date(dateHeader) : new Date(gmailMessage.internalDate);

    return {
      gmailMessageId: gmailMessage.id,
      threadId: gmailMessage.threadId,
      subject: getHeader('Subject') || '(No Subject)',
      fromEmail: from ? from.email : null,
      fromName: from ? from.name : null,
      toEmail: JSON.stringify(to.map(t => t.email)),
      ccEmail: cc.length > 0 ? JSON.stringify(cc.map(c => c.email)) : null,
      bccEmail: bcc.length > 0 ? JSON.stringify(bcc.map(b => b.email)) : null,
      bodyText: bodyContent.text,
      bodyHtml: bodyContent.html,
      receivedAt: receivedAt,
      sentAt: receivedAt, // Gmail doesn't always provide separate sent date
      isRead: !gmailMessage.labelIds || !gmailMessage.labelIds.includes('UNREAD'),
      isStarred: gmailMessage.labelIds && gmailMessage.labelIds.includes('STARRED'),
      labelIds: JSON.stringify(gmailMessage.labelIds || []),
      attachmentCount: attachmentCounter.count,
      userId: userId,
      contactId: null,
      accountId: null
    };
  }

  /**
   * Extract body text and HTML from email payload
   */
  extractBody(part, bodyContent) {
    if (part.body && part.body.data) {
      const content = Buffer.from(part.body.data, 'base64').toString('utf-8');
      if (part.mimeType === 'text/plain') {
        bodyContent.text += content;
      } else if (part.mimeType === 'text/html') {
        bodyContent.html += content;
      }
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        this.extractBody(subPart, bodyContent);
      }
    }
  }

  /**
   * Count attachments in email payload
   */
  countAttachments(part, counter) {
    if (part.filename && part.body && part.body.attachmentId) {
      counter.count++;
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        this.countAttachments(subPart, counter);
      }
    }
  }

  /**
   * Process and save email attachments
   */
  async processAttachments(user, messageId, emailId, gmailMessage) {
    const attachments = [];
    this.collectAttachments(gmailMessage.payload, attachments);

    for (const attachment of attachments) {
      try {
        // Get attachment data from Gmail
        const attachmentData = await this.gmailService.getEmailAttachment(
          user,
          messageId,
          attachment.attachmentId
        );

        const attachmentRecord = {
          emailId: emailId,
          gmailAttachmentId: attachment.attachmentId,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachmentData.size || 0,
          downloadUrl: null // Will be generated on-demand
        };

        await this.attachmentRepo.create(mapToSnakeCase(attachmentRecord));
      } catch (error) {
        logger.error(`Error processing attachment ${attachment.attachmentId}:`, error);
      }
    }
  }

  /**
   * Collect all attachments from email payload
   */
  collectAttachments(part, attachments) {
    if (part.filename && part.body && part.body.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId
      });
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        this.collectAttachments(subPart, attachments);
      }
    }
  }

  /**
   * Match email to contact or account
   * Smart matching: by label name, email address, or domain
   */
  async matchEmailToContactOrAccount(email, userId, labelName = null) {
    // Priority 1: Match by Gmail label name to account/contact name
    // This is the smart CRM feature - label names match customer names
    if (labelName) {
      // Try to match label name to account name (exact or partial match)
      const account = await this.findAccountByName(labelName, userId);
      if (account) {
        email.accountId = account.id;
        logger.info(`Matched email to account "${account.name}" by label name "${labelName}"`);
      }

      // Try to match label name to contact name (first name + last name)
      const contact = await this.findContactByName(labelName, userId);
      if (contact) {
        email.contactId = contact.id;
        // If contact has account, also link to account
        if (contact.accountId) {
          email.accountId = contact.accountId;
        }
        logger.info(`Matched email to contact "${contact.firstName} ${contact.lastName}" by label name "${labelName}"`);
        return; // Found contact, done
      }

      // If we found account by label name, we're done
      if (email.accountId) {
        return;
      }
    }

    // Priority 2: Try to match by sender email to contact
    if (email.fromEmail) {
      const contact = await this.contactRepo.findByEmail(email.fromEmail, userId);
      if (contact) {
        email.contactId = contact.id;
        // If contact has account, link email to account too
        if (contact.accountId) {
          email.accountId = contact.accountId;
        }
        logger.info(`Matched email to contact by email address: ${email.fromEmail}`);
        return;
      }
    }

    // Priority 3: Try to match by email domain to account website
    if (email.fromEmail) {
      const domain = email.fromEmail.split('@')[1];
      if (domain) {
        const account = await this.findAccountByDomain(domain, userId);
        if (account) {
          email.accountId = account.id;
          logger.info(`Matched email to account by domain: ${domain}`);
          return;
        }
      }
    }

    // No match found - email will remain unlinked
    logger.info(`No match found for email from ${email.fromEmail}, label: ${labelName}`);
  }

  /**
   * Find account by name (fuzzy matching)
   */
  async findAccountByName(name, userId) {
    if (!name) return null;

    // Normalize name for matching (remove extra spaces, lowercase)
    const normalizedName = name.trim().toLowerCase();

    // Try exact match first
    const sql = `SELECT * FROM ${this.accountRepo.tableName} 
                 WHERE LOWER(name) = ? AND owner_id = ? AND deleted_at IS NULL 
                 LIMIT 1`;
    const results = await this.accountRepo.query(sql, [normalizedName, userId]);
    if (results.length > 0) {
      const Account = require('../models/Account');
      return Account.fromDatabaseRow(results[0]);
    }

    // Try partial match (label name contains account name or vice versa)
    const partialSql = `SELECT * FROM ${this.accountRepo.tableName} 
                        WHERE (LOWER(name) LIKE ? OR ? LIKE CONCAT('%', LOWER(name), '%'))
                        AND owner_id = ? AND deleted_at IS NULL 
                        LIMIT 1`;
    const partialResults = await this.accountRepo.query(partialSql, [
      `%${normalizedName}%`,
      normalizedName,
      userId
    ]);
    if (partialResults.length > 0) {
      const Account = require('../models/Account');
      return Account.fromDatabaseRow(partialResults[0]);
    }

    return null;
  }

  /**
   * Find contact by name (fuzzy matching)
   */
  async findContactByName(name, userId) {
    if (!name) return null;

    // Normalize name for matching
    const normalizedName = name.trim().toLowerCase();

    // Try matching first name + last name
    const nameParts = normalizedName.split(/\s+/);
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const Contact = require('../models/Contact');
      const sql = `SELECT * FROM ${this.contactRepo.tableName} 
                   WHERE LOWER(first_name) = ? AND LOWER(last_name) = ? 
                   AND owner_id = ? AND deleted_at IS NULL 
                   LIMIT 1`;
      const results = await this.contactRepo.query(sql, [firstName, lastName, userId]);
      if (results.length > 0) {
        return Contact.fromDatabaseRow(results[0]);
      }
    }

    // Try matching just first name or last name
    if (nameParts.length >= 1) {
      const Contact = require('../models/Contact');
      const searchName = nameParts[0];
      const sql = `SELECT * FROM ${this.contactRepo.tableName} 
                   WHERE (LOWER(first_name) = ? OR LOWER(last_name) = ?)
                   AND owner_id = ? AND deleted_at IS NULL 
                   LIMIT 1`;
      const results = await this.contactRepo.query(sql, [searchName, searchName, userId]);
      if (results.length > 0) {
        return Contact.fromDatabaseRow(results[0]);
      }
    }

    // Try partial match
    const Contact = require('../models/Contact');
    const partialSql = `SELECT * FROM ${this.contactRepo.tableName} 
                        WHERE (LOWER(CONCAT(first_name, ' ', last_name)) LIKE ? 
                        OR ? LIKE CONCAT('%', LOWER(first_name), '%')
                        OR ? LIKE CONCAT('%', LOWER(last_name), '%'))
                        AND owner_id = ? AND deleted_at IS NULL 
                        LIMIT 1`;
    const partialResults = await this.contactRepo.query(partialSql, [
      `%${normalizedName}%`,
      normalizedName,
      normalizedName,
      userId
    ]);
    if (partialResults.length > 0) {
      return Contact.fromDatabaseRow(partialResults[0]);
    }

    return null;
  }

  /**
   * Find account by domain (from email domain)
   */
  async findAccountByDomain(domain, userId) {
    if (!domain) return null;

    // Try to match domain to account website
    const Account = require('../models/Account');
    const sql = `SELECT * FROM ${this.accountRepo.tableName} 
                 WHERE website IS NOT NULL 
                 AND (LOWER(website) LIKE ? OR LOWER(website) LIKE ?)
                 AND owner_id = ? AND deleted_at IS NULL 
                 LIMIT 1`;
    const results = await this.accountRepo.query(sql, [
      `%${domain}%`,
      `%${domain.replace('www.', '')}%`,
      userId
    ]);
    if (results.length > 0) {
      return Account.fromDatabaseRow(results[0]);
    }

    return null;
  }
}

module.exports = EmailSyncService;

