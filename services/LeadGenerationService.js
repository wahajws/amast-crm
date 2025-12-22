const QwenService = require('./QwenService');
const WebSearchService = require('./WebSearchService');
const WebScrapingService = require('./WebScrapingService');
const AccountServiceClass = require('./AccountService');
const ContactServiceClass = require('./ContactService');
const CompanyProfileService = require('./CompanyProfileService');
const { logger } = require('../utils/logger');

class LeadGenerationService {
  constructor() {
    this.accountService = new AccountServiceClass();
    this.contactService = new ContactServiceClass();
  }

  /**
   * Analyze company website and create profile
   */
  async analyzeCompanyWebsite(url, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required to analyze company website');
      }

      logger.info(`Analyzing company website: ${url} for user: ${userId}`);

      // Step 1: Scrape website
      const scrapedData = await WebScrapingService.scrapeWebsite(url);
      
      if (scrapedData.error) {
        throw new Error(`Failed to scrape website: ${scrapedData.error}`);
      }

      // Step 2: Use Qwen to analyze content
      const analysis = await QwenService.analyzeCompanyWebsite(
        scrapedData.content,
        url
      );

      // Step 3: Combine scraped data with AI analysis
      let productsServicesFormatted = '';
      if (Array.isArray(analysis.productsServices)) {
        if (analysis.productsServices.length > 0 && typeof analysis.productsServices[0] === 'object') {
          productsServicesFormatted = analysis.productsServices.map(ps => {
            if (ps.name) {
              return `${ps.name}${ps.description ? ': ' + ps.description : ''}`;
            }
            return JSON.stringify(ps);
          }).join(' | ');
        } else {
          productsServicesFormatted = analysis.productsServices.join(', ');
        }
      } else if (analysis.productsServices) {
        productsServicesFormatted = analysis.productsServices;
      }

      const companyProfile = {
        userId: userId, // Ensure userId is set
        user_id: userId, // Also set snake_case version
        companyUrl: url,
        company_url: url, // Also set snake_case version
        companyName: analysis.companyName || scrapedData.title || 'Unknown',
        description: analysis.description || scrapedData.metaDescription || '',
        productsServices: productsServicesFormatted,
        industry: analysis.industry || null,
        targetMarket: analysis.targetMarket || null,
        companySize: analysis.companySize || null,
        metadata: {
          scrapedTitle: scrapedData.title,
          metaDescription: scrapedData.metaDescription,
          metaKeywords: scrapedData.metaKeywords,
          keyFeatures: analysis.keyFeatures || [],
          productsServicesDetailed: Array.isArray(analysis.productsServices) ? analysis.productsServices : null,
          sections: WebScrapingService.extractKeySections(scrapedData),
          contactInfo: WebScrapingService.extractContactInfo(scrapedData)
        }
      };

      // Save profile - pass user object with id
      const user = { id: userId };
      const profile = await CompanyProfileService.create(companyProfile, user);

      logger.info(`Company analysis complete: ${companyProfile.companyName}`);
      return profile;
    } catch (error) {
      logger.error('Error analyzing company website:', error);
      throw error;
    }
  }

  /**
   * Generate leads based on company profile
   */
  async generateLeads(companyProfile, options = {}) {
    try {
      const {
        numLeads = 100,
        industries = [],
        locations = [],
      } = options;

      // Limit numLeads to prevent extremely long processing times
      const maxLeads = Math.min(numLeads, 200);
      if (numLeads > maxLeads) {
        logger.warn(`Requested ${numLeads} leads, limiting to ${maxLeads} for performance`);
      }

      logger.info(`Generating ${maxLeads} leads for company: ${companyProfile.companyName}`);

      // Step 1: Generate search queries
      const searchQueries = await QwenService.generateSearchQueries(companyProfile, 10);
      logger.info(`Generated ${searchQueries.length} search queries`);

      // Step 2: Perform web searches
      const allSearchResults = [];
      const queryMap = new Map(); // Map results to their queries
      for (let qIndex = 0; qIndex < searchQueries.length; qIndex++) {
        const query = searchQueries[qIndex];
        try {
          logger.info(`Searching query ${qIndex + 1}/${searchQueries.length}: "${query.substring(0, 50)}..."`);
          const results = await WebSearchService.search(query, 10);
          results.forEach(result => {
            queryMap.set(result.url, query); // Store query for each result
          });
          allSearchResults.push(...results);
          logger.info(`Query ${qIndex + 1} complete: found ${results.length} results`);
          await new Promise(resolve => setTimeout(resolve, 400)); // Reduced delay
        } catch (error) {
          logger.error(`Error searching for "${query}":`, error.message);
        }
      }

      if (allSearchResults.length === 0) {
        throw new Error('No search results found. Please check your search API configuration.');
      }

      logger.info(`Found ${allSearchResults.length} search results`);

      // Step 3: Extract company data from search results
      const batchSize = 20;
      const extractedCompanies = [];
      const seenDomains = new Set(); // Track domains to prevent duplicates
      
      // Helper function to extract domain from URL
      const extractDomain = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.replace(/^www\./, '').toLowerCase();
        } catch {
          return null;
        }
      };

      // Helper function to check if URL is a review/comparison site
      const isReviewSite = (url) => {
        const reviewPatterns = [
          'tooltester', 'comparison', 'review', 'best-of', 'top-', 'vs-', 
          'alternatives', 'vs.', 'compare', 'reviews', 'rating', 'ranking',
          'g2.com', 'capterra', 'trustpilot', 'softwareadvice', 'getapp'
        ];
        const urlLower = url.toLowerCase();
        return reviewPatterns.some(pattern => urlLower.includes(pattern));
      };

      for (let i = 0; i < allSearchResults.length; i += batchSize) {
        const batch = allSearchResults.slice(i, i + batchSize);
        try {
          logger.info(`Extracting company data from batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allSearchResults.length / batchSize)}...`);
          const extracted = await QwenService.extractCompanyDataFromSearch(batch);
          
          // Filter out review sites and duplicates
          for (const company of extracted) {
            if (!company.website) continue;
            
            const domain = extractDomain(company.website);
            if (!domain) continue;
            
            // Skip review/comparison sites
            if (isReviewSite(company.website)) {
              logger.info(`Filtered out review site: ${company.name || domain}`);
              continue;
            }
            
            // Skip duplicates
            if (seenDomains.has(domain)) {
              logger.info(`Skipped duplicate domain: ${company.name || domain}`);
              continue;
            }
            
            seenDomains.add(domain);
            extractedCompanies.push(company);
          }
          
          logger.info(`Batch ${Math.floor(i / batchSize) + 1} complete: extracted ${extracted.length} companies (${extractedCompanies.length} unique after filtering)`);
          await new Promise(resolve => setTimeout(resolve, 800)); // Reduced delay
        } catch (error) {
          logger.error(`Error extracting company data from batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        }
      }

      logger.info(`Extracted ${extractedCompanies.length} unique companies (after filtering duplicates and review sites)`);

      // Step 4: Verify and enrich each company (sequential to avoid rate limits)
      const enrichedCompanies = [];
      const totalToProcess = Math.min(extractedCompanies.length, maxLeads);
      
      logger.info(`Starting enrichment and scoring for ${totalToProcess} companies...`);
      
      for (let i = 0; i < totalToProcess; i++) {
        const company = extractedCompanies[i];
        try {
          // Log progress every 10 companies
          if (i % 10 === 0 && i > 0) {
            logger.info(`Processing company ${i + 1}/${totalToProcess} (${enrichedCompanies.length} enriched so far)`);
          }
          
          // Reduced delay - only between API calls, not before first
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 300)); // Reduced to 0.3s
          }
          
          // Enrich company (with timeout protection)
          let enriched = company;
          try {
            enriched = await Promise.race([
              QwenService.verifyAndEnrichCompany(company),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Enrichment timeout')), 30000)
              )
            ]);
          } catch (enrichError) {
            logger.warn(`Enrichment failed for company ${i + 1}, using original data:`, enrichError.message);
            // Continue with original company data
          }
          
          // Small delay before scoring
          await new Promise(resolve => setTimeout(resolve, 300)); // Reduced to 0.3s
          
          // Step 5: Score relevance (with timeout protection)
          let scoring = { score: 50, reasons: ['Unable to calculate score'] };
          try {
            scoring = await Promise.race([
              QwenService.scoreLeadRelevance(enriched, companyProfile),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Scoring timeout')), 20000)
              )
            ]);
          } catch (scoreError) {
            logger.warn(`Scoring failed for company ${i + 1}, using default score:`, scoreError.message);
            // Continue with default score
          }
          
          // Get the query that found this company
          const searchQuery = queryMap.get(company.website) || 'Unknown';
          
          // Filter out low-scoring leads (likely competitors) - only keep scores >= 15
          // Lowered to 15 to allow more potential customers through while still filtering obvious competitors
          // Companies scoring 15-19 are potential customers that need more evaluation
          if (scoring.score >= 15) {
            enrichedCompanies.push({
              ...enriched,
              relevanceScore: scoring.score,
              relevanceReasons: scoring.reasons,
              source: 'web_search',
              searchQuery
            });
          } else {
            logger.info(`Filtered out low-relevance lead (score: ${scoring.score}): ${enriched.name || 'Unknown'}`);
          }
        } catch (error) {
          logger.error(`Error processing company ${i + 1}/${totalToProcess}:`, error.message);
          // Continue processing other companies even if one fails
        }
      }
      
      logger.info(`Completed enrichment: ${enrichedCompanies.length} companies processed`);

      // Sort by relevance score
      enrichedCompanies.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      logger.info(`Generated ${enrichedCompanies.length} leads (requested: ${maxLeads})`);
      return enrichedCompanies.slice(0, maxLeads);
    } catch (error) {
      logger.error('Error generating leads:', error);
      throw error;
    }
  }

  /**
   * Import leads as accounts and contacts
   */
  async importLeads(leads, userId) {
    try {
      const imported = {
        accounts: [],
        contacts: [],
        errors: [],
      };

      // Create user object with both id and userId for compatibility
      const user = { id: userId, userId: userId };

      for (const lead of leads) {
        try {
          // Check if account already exists (by name and owner)
          let account = null;
          const accountName = lead.name || 'Unknown Company';
          
          // Try to find existing account by name
          const existingAccounts = await this.accountService.findAll(
            { 
              where: 'LOWER(a.name) = LOWER(?) AND a.owner_id = ?',
              params: [accountName, userId]
            },
            { id: userId, userId: userId }
          );
          
          if (existingAccounts && existingAccounts.data && existingAccounts.data.length > 0) {
            account = existingAccounts.data[0];
            logger.info(`Account already exists: ${accountName} (ID: ${account.id})`);
          } else {
            // Create account with all available CRM fields
            const accountData = {
              name: accountName,
              website: lead.website || null,
              industry: lead.industry || null,
              description: lead.description || null,
              phone: lead.phone || null,
              email: lead.contactEmail || null, // Use contact email as account email if available
              billingCity: lead.location?.city || lead.billingCity || null,
              billingState: lead.location?.state || lead.billingState || null,
              billingCountry: lead.location?.country || lead.billingCountry || null,
              annualRevenue: lead.annualRevenue || null,
              numberOfEmployees: lead.numberOfEmployees || null,
              ownerId: userId,
              createdBy: userId,
            };

            logger.info(`Importing account: ${accountData.name}`);
            account = await this.accountService.create(accountData, user);
            logger.info(`Account created successfully: ${account.id}`);
          }

          // Create contact if email available
          if (lead.contactEmail) {
            // Check if contact already exists (by email)
            const ContactRepository = require('../repositories/ContactRepository');
            const contactRepo = new ContactRepository();
            const existingContact = await contactRepo.findByEmail(lead.contactEmail, userId);
            
            if (existingContact) {
              logger.info(`Contact already exists: ${lead.contactEmail} (ID: ${existingContact.id})`);
              // Update contact's account if it's not set or different
              if (!existingContact.accountId && account.id) {
                await this.contactService.update(existingContact.id, { accountId: account.id }, user);
                logger.info(`Updated contact ${existingContact.id} to link with account ${account.id}`);
              }
              imported.contacts.push(existingContact);
            } else {
              // Try to extract first and last name from lead data
              let firstName = 'Contact';
              let lastName = '';
              let title = null;
              let department = null;
              
              if (lead.contactName) {
                const nameParts = lead.contactName.split(' ');
                firstName = nameParts[0] || 'Contact';
                lastName = nameParts.slice(1).join(' ') || '';
              } else if (lead.name) {
                // Fallback to company name if contact name not available
                const nameParts = lead.name.split(' ');
                firstName = nameParts[0] || 'Contact';
                lastName = nameParts.slice(1).join(' ') || '';
              }
              
              // Extract title and department if available
              if (lead.contactTitle) {
                title = lead.contactTitle;
              }
              
              // Try to infer department from title
              if (title) {
                const titleLower = title.toLowerCase();
                if (titleLower.includes('sales') || titleLower.includes('account')) {
                  department = 'Sales';
                } else if (titleLower.includes('marketing')) {
                  department = 'Marketing';
                } else if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('founder')) {
                  department = 'Executive';
                } else if (titleLower.includes('manager') || titleLower.includes('director')) {
                  department = 'Management';
                }
              }

              const contactData = {
                firstName: firstName,
                lastName: lastName,
                email: lead.contactEmail,
                phone: lead.phone || null,
                title: title,
                department: department,
                mailingCity: lead.location?.city || lead.billingCity || null,
                mailingState: lead.location?.state || lead.billingState || null,
                mailingCountry: lead.location?.country || lead.billingCountry || null,
                description: lead.description || null,
                accountId: account.id,
                ownerId: userId,
                createdBy: userId,
              };

              logger.info(`Importing contact: ${contactData.email} for account ${account.id}`);
              const contact = await this.contactService.create(contactData, user);
              logger.info(`Contact created successfully: ${contact.id}`);
              imported.contacts.push(contact);
            }
          }

          imported.accounts.push(account);
        } catch (error) {
          logger.error(`Error importing lead "${lead.name || 'Unknown'}":`, error);
          imported.errors.push({
            lead: lead.name || 'Unknown',
            error: error.message || 'Unknown error',
          });
        }
      }

      logger.info(`Import complete: ${imported.accounts.length} accounts, ${imported.contacts.length} contacts, ${imported.errors.length} errors`);
      return imported;
    } catch (error) {
      logger.error('Error importing leads:', error);
      throw error;
    }
  }
}

module.exports = new LeadGenerationService();

