const ExcelParserService = require('./ExcelParserService');
const WebSearchService = require('./WebSearchService');
const QwenService = require('./QwenService');
const AccountService = require('./AccountService');
const ContactService = require('./ContactService');
const CompanyProfileService = require('./CompanyProfileService');
const EmailCampaignService = require('./EmailCampaignService');
const { logger } = require('../utils/logger');

class BulkImportService {
  constructor() {
    this.accountService = new AccountService();
    this.contactService = new ContactService();
  }

  /**
   * Process bulk import: parse Excel, enrich data, generate emails, save to database
   * @param {Buffer} fileBuffer - Excel file buffer
   * @param {number} companyProfileId - Selected company profile ID
   * @param {number} userId - User ID
   * @returns {Object} Results with contacts, accounts, and errors
   */
  async processBulkImport(fileBuffer, companyProfileId, userId) {
    try {
      // Step 1: Get company profile
      const companyProfile = await CompanyProfileService.findById(companyProfileId);
      if (!companyProfile || companyProfile.userId !== userId) {
        throw new Error('Company profile not found or access denied');
      }

      // Step 2: Parse Excel file
      logger.info('Parsing Excel file...');
      const customers = ExcelParserService.parseExcel(fileBuffer);
      
      if (customers.length === 0) {
        throw new Error('No customers found in Excel file. Please ensure the file contains email addresses.');
      }

      logger.info(`Found ${customers.length} customers in Excel file`);

      // Step 3: Process each customer
      const results = {
        contacts: [],
        accounts: [],
        errors: [],
        total: customers.length,
        processed: 0,
      };

      const user = { id: userId, userId: userId };
      
      // Track processed emails to prevent duplicates in the same batch
      const processedEmails = new Set();

      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        
        // Skip if email already processed in this batch
        if (processedEmails.has(customer.email.toLowerCase())) {
          logger.info(`Skipping duplicate email in batch: ${customer.email}`);
          results.errors.push({
            email: customer.email,
            rowNumber: customer.rowNumber,
            error: 'Duplicate email in the same file'
          });
          continue;
        }
        
        processedEmails.add(customer.email.toLowerCase());
        
        try {
          logger.info(`Processing customer ${i + 1}/${customers.length}: ${customer.email}`);

          // Step 3a: Enrich customer data using web search (if domain available)
          let enrichedData = { ...customer };
          if (customer.emailDomain) {
            try {
              enrichedData = await this.enrichCustomerData(customer, companyProfile);
            } catch (error) {
              logger.warn(`Enrichment failed for ${customer.email}, using original data:`, error.message);
            }
          }

          // Step 3b: Generate email and subject using LLM
          let emailData = { subject: null, email: null };
          try {
            emailData = await QwenService.generateEmailAndSubject(enrichedData, companyProfile);
            logger.info(`Generated email for ${customer.email}`);
          } catch (error) {
            logger.warn(`Email generation failed for ${customer.email}:`, error.message);
          }

          // Step 3c: Create or find account (with duplicate checking)
          let account = null;
          const accountName = enrichedData.companyName || customer.emailDomain?.split('.')[0] || 'Unknown Company';
          
          // Try to find existing account by name
          const existingAccounts = await this.accountService.findAll(
            { 
              where: 'LOWER(a.name) = LOWER(?) AND a.owner_id = ?',
              params: [accountName, userId]
            },
            user
          );
          
          if (existingAccounts && existingAccounts.data && existingAccounts.data.length > 0) {
            account = existingAccounts.data[0];
            logger.info(`Using existing account: ${accountName} (ID: ${account.id})`);
          } else {
            // Also check by website if available
            if (enrichedData.website) {
              const accountsByWebsite = await this.accountService.findAll(
                { 
                  where: 'LOWER(a.website) = LOWER(?) AND a.owner_id = ?',
                  params: [enrichedData.website, userId]
                },
                user
              );
              
              if (accountsByWebsite && accountsByWebsite.data && accountsByWebsite.data.length > 0) {
                account = accountsByWebsite.data[0];
                logger.info(`Using existing account by website: ${account.name} (ID: ${account.id})`);
              }
            }
            
            // Create new account only if not found
            if (!account) {
              const accountData = {
                name: accountName,
                website: enrichedData.website || null,
                industry: enrichedData.industry || null,
                description: enrichedData.description || null,
                phone: enrichedData.phone || null,
                email: customer.email, // Use contact email as account email
                billingCity: enrichedData.location?.city || null,
                billingState: enrichedData.location?.state || null,
                billingCountry: enrichedData.location?.country || null,
                ownerId: userId,
                createdBy: userId,
              };

              account = await this.accountService.create(accountData, user);
              logger.info(`Created account: ${accountName} (ID: ${account.id})`);
            }
          }

          // Only add to results if not already added (prevent duplicates in results array)
          const accountExists = results.accounts.some(a => a.id === account.id);
          if (!accountExists) {
            results.accounts.push(account);
          }

          // Step 3d: Create or update contact with email template (with duplicate checking)
          const ContactRepository = require('../repositories/ContactRepository');
          const contactRepo = new ContactRepository();
          const existingContact = await contactRepo.findByEmail(customer.email, userId);
          
          let contact = null;
          
          if (existingContact) {
            // Update existing contact with email template and account link
              const updateData = {
                emailTemplate: emailData.email,
                emailSubject: this.cleanSubject(emailData.subject),
                emailGeneratedAt: new Date(),
              };
            
            // Only update accountId if it's not already set or different
            if (!existingContact.accountId || existingContact.accountId !== account.id) {
              updateData.accountId = account.id;
            }
            
            await this.contactService.update(existingContact.id, updateData, user);
            contact = { ...existingContact, ...updateData };
            logger.info(`Updated existing contact: ${customer.email} (ID: ${existingContact.id})`);
          } else {
            // Check if contact already exists in results (same email in same batch)
            const duplicateInBatch = results.contacts.find(c => c.email === customer.email);
            if (duplicateInBatch) {
              logger.info(`Skipping duplicate contact in batch: ${customer.email}`);
              contact = duplicateInBatch;
            } else {
              // Create new contact
              // Ensure last_name is never null (database requirement)
              const firstName = enrichedData.firstName || 'Contact';
              const lastName = enrichedData.lastName || 'N/A'; // Use 'N/A' if no last name found
              
              const contactData = {
                firstName: firstName,
                lastName: lastName, // Always has a value
                email: customer.email,
                phone: enrichedData.phone || null,
                title: enrichedData.title || null,
                department: enrichedData.department || null,
                mailingCity: enrichedData.location?.city || null,
                mailingState: enrichedData.location?.state || null,
                mailingCountry: enrichedData.location?.country || null,
                accountId: account.id,
                emailTemplate: emailData.email,
                emailSubject: this.cleanSubject(emailData.subject),
                emailGeneratedAt: new Date(),
                ownerId: userId,
                createdBy: userId,
              };

              contact = await this.contactService.create(contactData, user);
              logger.info(`Created contact: ${customer.email} (ID: ${contact.id})`);
            }
          }
          
          // Only add to results if not already added (prevent duplicates in results array)
          if (contact) {
            const contactExists = results.contacts.some(c => 
              (c.id && contact.id && c.id === contact.id) || 
              (c.email === contact.email)
            );
            if (!contactExists) {
              results.contacts.push(contact);
            }
            
            // Step 3e: Create email campaign record
            try {
              const campaignData = {
                contactId: contact.id,
                accountId: account.id,
                emailSubject: this.cleanSubject(emailData.subject),
                emailTemplate: emailData.email,
                status: 'PENDING',
                priority: 'MEDIUM',
                ownerId: userId,
                createdBy: userId,
              };
              
              const campaign = await EmailCampaignService.create(campaignData, user);
              logger.info(`Created email campaign for contact ${contact.email} (ID: ${campaign.id})`);
            } catch (campaignError) {
              logger.warn(`Failed to create email campaign for ${contact.email}:`, campaignError.message);
              // Don't fail the whole import if campaign creation fails
            }
          }

          results.processed++;
          
          // Small delay to avoid rate limits
          if (i < customers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          logger.error(`Error processing customer ${customer.email}:`, error);
          results.errors.push({
            email: customer.email,
            rowNumber: customer.rowNumber,
            error: error.message || 'Unknown error'
          });
        }
      }

      logger.info(`Bulk import complete: ${results.processed}/${results.total} processed, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      logger.error('Error in bulk import:', error);
      throw error;
    }
  }

  /**
   * Enrich customer data using web search
   */
  async enrichCustomerData(customer, companyProfile) {
    try {
      // Search for company information using domain or company name
      const searchQuery = customer.companyName 
        ? `${customer.companyName} company information`
        : `company ${customer.emailDomain}`;
      
      const searchResults = await WebSearchService.search(searchQuery, 5);
      
      if (searchResults.length === 0) {
        return customer; // Return original if no search results
      }

      // Use Qwen to extract and enrich company data from search results
      const enriched = await QwenService.verifyAndEnrichCompany({
        name: customer.companyName || customer.emailDomain,
        website: customer.website || `https://${customer.emailDomain}`,
        description: searchResults[0]?.snippet || '',
        industry: customer.industry,
        location: customer.location,
      });

      // Merge enriched data with original customer data
      return {
        ...customer,
        companyName: enriched.name || customer.companyName,
        website: enriched.website || customer.website,
        industry: enriched.industry || customer.industry,
        description: enriched.description || customer.description,
        phone: enriched.phone || customer.phone,
        location: enriched.location || customer.location,
        companySize: enriched.companySize,
        annualRevenue: enriched.annualRevenue,
        numberOfEmployees: enriched.numberOfEmployees,
      };
    } catch (error) {
      logger.warn(`Enrichment error for ${customer.email}:`, error.message);
      return customer; // Return original on error
    }
  }
}

module.exports = new BulkImportService();

