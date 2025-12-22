const axios = require('axios');
const { logger } = require('../utils/logger');

class QwenService {
  constructor() {
    // Support both naming conventions
    this.apiKey = process.env.ALIBABA_LLM_API_KEY || process.env.QWEN_API_KEY;
    this.apiBaseUrl = process.env.ALIBABA_LLM_API_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';
    this.model = process.env.ALIBABA_LLM_API_MODEL || 'qwen-plus';
    
    if (!this.apiKey) {
      logger.warn('Qwen API key not configured. Lead generation features will be limited.');
    }
  }

  /**
   * Call Qwen API with retry logic for rate limits
   */
  async callQwen(prompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      retries = 3
    } = options;

    if (!this.apiKey) {
      throw new Error('Qwen API key is not configured. Please set ALIBABA_LLM_API_KEY environment variable.');
    }

    // Check if using compatible mode endpoint
    const isCompatibleMode = this.apiBaseUrl.includes('/compatible-mode/');

    const requestData = isCompatibleMode
      ? {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }
      : {
          model: this.model,
          input: { prompt },
          parameters: {
            temperature,
            max_tokens: maxTokens,
          },
        };

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.post(
          isCompatibleMode
            ? `${this.apiBaseUrl}/chat/completions`
            : `${this.apiBaseUrl}/services/aigc/text-generation/generation`,
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 seconds
          }
        );

        if (isCompatibleMode) {
          return response.data.choices[0]?.message?.content || response.data.choices[0]?.text || '';
        } else {
          return response.data.output?.text || response.data.output?.choices[0]?.message?.content || '';
        }
      } catch (error) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.message || error.message;

        if (statusCode === 429 && attempt < retries - 1) {
          // Rate limit - exponential backoff
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          logger.warn(`Qwen API rate limit hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (statusCode === 401) {
          throw new Error('Invalid Qwen API key. Please check your ALIBABA_LLM_API_KEY environment variable.');
        }

        if (statusCode === 404) {
          throw new Error(`Qwen API endpoint not found. Please check your ALIBABA_LLM_API_BASE_URL. Current: ${this.apiBaseUrl}`);
        }

        if (statusCode === 429) {
          throw new Error('Qwen API rate limit exceeded. Please wait a moment and try again.');
        }

        logger.error('Qwen API call failed:', errorMessage);
        throw new Error(`Qwen API call failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Analyze company website content
   */
  async analyzeCompanyWebsite(scrapedContent, url) {
    const prompt = `Analyze this company website and extract detailed information. Return ONLY a valid JSON object with no additional text.

Website URL: ${url}

Website Content:
${scrapedContent.substring(0, 8000)} // Limit content to avoid token limits

Extract and return a JSON object with this exact structure:
{
  "companyName": "Company name",
  "description": "Detailed company description (2-3 paragraphs)",
  "productsServices": [
    {
      "name": "Product/Service name",
      "description": "Detailed description",
      "features": ["feature1", "feature2"],
      "useCases": "Who uses this and for what",
      "benefits": "What problems it solves",
      "targetAudience": "Who is this for"
    }
  ],
  "industry": "Primary industry",
  "targetMarket": "Target market description",
  "companySize": "Company size (e.g., Small, Medium, Large, Enterprise)"
}

Focus on extracting ALL products and services with maximum detail. This information will be used to find potential leads.`;

    try {
      const response = await this.callQwen(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      let jsonStr = response.trim();
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract JSON object if there's extra text
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      const analysis = JSON.parse(jsonStr);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing company website:', error);
      throw new Error(`Failed to analyze company website: ${error.message}`);
    }
  }

  /**
   * Generate search queries based on company profile
   */
  async generateSearchQueries(companyProfile, count = 10) {
    const productsInfo = companyProfile.productsServices || 'Not specified';
    const productsDetailed = companyProfile.metadata?.productsServicesDetailed;
    const companyName = companyProfile.companyName || 'this company';
    
    let productsText = productsInfo;
    if (productsDetailed && Array.isArray(productsDetailed)) {
      productsText = productsDetailed.map(ps => {
        if (typeof ps === 'object' && ps.name) {
          return `${ps.name}${ps.useCases ? ' (for: ' + ps.useCases + ')' : ''}${ps.benefits ? ' - solves: ' + ps.benefits : ''}`;
        }
        return JSON.stringify(ps);
      }).join(' | ');
    }

    const prompt = `Generate ${count} specific web search queries to find POTENTIAL CLIENTS (customers who would BUY from ${companyName}), NOT competitors.

Company Profile:
- Company Name: ${companyName}
- Industry: ${companyProfile.industry || 'Not specified'}
- Products/Services: ${productsText}
- Target Market: ${companyProfile.targetMarket || 'Not specified'}

CRITICAL: Generate search queries that find COMPANIES WHO NEED AND WOULD BUY these products/services, NOT companies that sell similar products.

Good queries find:
- Companies in industries that USE these solutions (e.g., if selling CRM software, find companies that need CRM)
- Companies with problems these products solve
- Companies looking for these types of services
- Companies that would be customers/clients

BAD queries (avoid these):
- Companies selling similar products (competitors)
- Companies in the same industry selling the same thing
- Companies that are vendors/suppliers

Generate diverse search queries like:
- "[industry] companies looking for [solution type]"
- "[industry] businesses needing [product category]"
- "Companies using [alternative solution] that need upgrade"
- "[Target market] companies seeking [service type]"

Return ONLY a JSON array of search query strings, no additional text:
["query 1", "query 2", "query 3", ...]`;

    try {
      const response = await this.callQwen(prompt, {
        temperature: 0.8,
        maxTokens: 2000,
      });

      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }

      const queries = JSON.parse(jsonStr);
      return Array.isArray(queries) ? queries : [];
    } catch (error) {
      logger.error('Error generating search queries:', error);
      return [];
    }
  }

  /**
   * Extract company data from search results
   */
  async extractCompanyDataFromSearch(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      logger.warn('No search results provided for extraction');
      return [];
    }

    // Limit to first 20 results to avoid token limits
    const limitedResults = searchResults.slice(0, 20);
    
    const prompt = `Extract company information from these web search results. Each result has a title, URL, and snippet/description.

Search Results:
${JSON.stringify(limitedResults, null, 2)}

For each search result, extract company information:
- name: Company name (from title or URL domain)
- website: Full website URL (use the URL from the result)
- description: Combine title and snippet into a detailed description
- industry: Infer industry from title/description if possible
- location: Extract {city, state, country} if mentioned in snippet

IMPORTANT: 
1. Extract information for ALL results provided, even if some fields are missing
2. Only extract companies that appear to be POTENTIAL CLIENTS (customers who would buy), NOT competitors
3. If a result doesn't clearly show a company, still extract what you can (name from URL domain, description from snippet)

Return ONLY a JSON array with one object per search result. If you cannot extract a company from a result, return an empty object {} for that result, but still include it in the array.

Example format:
[
  {
    "name": "Company Name from Title",
    "website": "https://example.com",
    "description": "Combined title and snippet description",
    "industry": "Inferred industry",
    "location": {"city": "City", "state": "State", "country": "Country"}
  },
  {
    "name": "Another Company",
    "website": "https://another.com",
    "description": "Description",
    "industry": null,
    "location": null
  }
]

Return the JSON array now:`;

    try {
      logger.info(`Extracting company data from ${limitedResults.length} search results`);
      
      const response = await this.callQwen(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }

      const companies = JSON.parse(jsonStr);
      
      // Filter out empty objects and ensure we have valid companies
      const validCompanies = Array.isArray(companies) 
        ? companies.filter(c => c && c.name && c.website)
        : [];
      
      logger.info(`Extracted ${validCompanies.length} valid companies from ${limitedResults.length} search results`);
      return validCompanies;
    } catch (error) {
      logger.error('Error extracting company data:', error.message);
      
      // Fallback: try to extract basic info from search results directly
      const fallbackCompanies = limitedResults
        .filter(r => r && r.url && (r.title || r.url))
        .map(r => ({
          name: r.title || this.extractDomainName(r.url),
          website: r.url,
          description: `${r.title || ''} ${r.snippet || ''}`.trim() || 'No description available',
          industry: null,
          location: null
        }));
      
      logger.info(`Using fallback extraction: ${fallbackCompanies.length} companies`);
      return fallbackCompanies;
    }
  }

  /**
   * Extract domain name from URL
   */
  extractDomainName(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown Company';
    }
  }

  /**
   * Verify and enrich company data
   */
  async verifyAndEnrichCompany(companyData) {
    const prompt = `Verify and enrich this company data with complete CRM information. Return ONLY a valid JSON object, no additional text.

Company Data:
${JSON.stringify(companyData, null, 2)}

Enrich with ALL available CRM fields:
- contactEmail: Best guess contact email (format: contact@company.com, info@company.com, sales@company.com, or hello@company.com)
- phone: Primary phone number
- companySize: Estimate (Small: <50, Medium: 50-500, Large: 500-5000, Enterprise: >5000)
- industry: Refined industry classification
- annualRevenue: Estimated annual revenue if available
- numberOfEmployees: Estimated employee count if available
- billingCity: City from location if available
- billingState: State from location if available
- billingCountry: Country from location if available
- contactName: Best guess contact person name (e.g., "Sales Manager", "Business Owner", or generic "Contact")
- contactTitle: Best guess job title (e.g., "CEO", "Manager", "Director")

Return JSON object with all original fields plus enriched fields. Include ALL fields even if null.`;

    try {
      const response = await this.callQwen(prompt, {
        temperature: 0.2,
        maxTokens: 1000,
      });

      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      const enriched = JSON.parse(jsonStr);
      return { ...companyData, ...enriched };
    } catch (error) {
      logger.error('Error enriching company:', error);
      return companyData; // Return original if enrichment fails
    }
  }

  /**
   * Score lead relevance
   */
  async scoreLeadRelevance(leadData, companyProfile) {
    const productsServicesText = companyProfile.productsServices || 'Not specified';
    const productsServicesDetailed = companyProfile.metadata?.productsServicesDetailed;
    const companyName = companyProfile.companyName || 'the company';
    
    let productsInfo = productsServicesText;
    if (productsServicesDetailed && Array.isArray(productsServicesDetailed)) {
      productsInfo = productsServicesDetailed.map(ps => {
        if (typeof ps === 'object' && ps.name) {
          return `${ps.name}${ps.useCases ? ' (for: ' + ps.useCases + ')' : ''}${ps.benefits ? ' - solves: ' + ps.benefits : ''}`;
        }
        return JSON.stringify(ps);
      }).join(' | ');
    }

    const prompt = `Score the relevance of this potential lead (0-100) as a CUSTOMER/CLIENT for ${companyName}. This lead should be a company that would BUY from ${companyName}, NOT a competitor.

Company Profile (${companyName}):
- Industry: ${companyProfile.industry || 'Not specified'}
- Products/Services: ${productsInfo}
- Target Market: ${companyProfile.targetMarket || 'Not specified'}

Lead Data:
${JSON.stringify(leadData, null, 2)}

CRITICAL SCORING RULES:
1. PENALIZE HEAVILY (score 0-15) ONLY if lead is clearly:
   - A direct competitor (sells identical/similar products/services to the same market)
   - In the same industry selling the exact same thing
   - A vendor/supplier of identical solutions

2. REWARD HIGHLY (score 70-100) if lead:
   - Is in an industry that USES/NEEDS these products/services
   - Has problems these products solve
   - Would be a customer/client (buys, not sells)
   - Matches target market
   - Has complete contact information

3. MIDDLE RANGE (score 20-69) for leads that:
   - Could potentially use these products/services (even if not perfect match)
   - Are in related industries that might benefit
   - Have some alignment with target market
   - Show potential as customers even if not ideal

4. Consider factors:
   - Industry match (does lead's industry NEED these solutions as customers?)
   - Company size fit (matches target market?)
   - Geographic relevance
   - Product/service alignment (would this lead BUY the products/services?)
   - Use case match (does the lead have problems these products solve?)
   - Data completeness (email, phone, address)
   - Be GENEROUS with scoring - err on the side of including potential customers

Return ONLY a JSON object with:
{
  "score": <number 0-100>,
  "reasons": ["reason1", "reason2", ...]
}

No additional text.`;

    try {
      const response = await this.callQwen(prompt, {
        temperature: 0.2,
        maxTokens: 500,
      });

      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      const scoring = JSON.parse(jsonStr);
      return {
        score: scoring.score || 50,
        reasons: scoring.reasons || []
      };
    } catch (error) {
      logger.error('Error scoring lead:', error);
      return { score: 50, reasons: ['Unable to calculate relevance score'] };
    }
  }

  /**
   * Generate personalized email and subject for a contact
   * @param {Object} contactData - Contact/customer data
   * @param {Object} companyProfile - Your company profile (from CRM)
   * @returns {Object} { subject, email }
   */
  async generateEmailAndSubject(contactData, companyProfile) {
    const productsServicesText = companyProfile.productsServices || 'Not specified';
    const productsServicesDetailed = companyProfile.metadata?.productsServicesDetailed;
    
    let productsInfo = productsServicesText;
    if (productsServicesDetailed && Array.isArray(productsServicesDetailed)) {
      productsInfo = productsServicesDetailed.map(ps => {
        if (typeof ps === 'object' && ps.name) {
          return `${ps.name}${ps.description ? ': ' + ps.description : ''}${ps.benefits ? ' - ' + ps.benefits : ''}`;
        }
        return JSON.stringify(ps);
      }).join(' | ');
    }

    const prompt = `Generate a personalized, professional sales email and subject line for a potential customer.

YOUR COMPANY PROFILE:
- Company Name: ${companyProfile.companyName || 'Your Company'}
- Industry: ${companyProfile.industry || 'Not specified'}
- Products/Services: ${productsInfo}
- Target Market: ${companyProfile.targetMarket || 'Not specified'}

CUSTOMER INFORMATION:
- Name: ${contactData.firstName || ''} ${contactData.lastName || ''}
- Company: ${contactData.companyName || 'Unknown'}
- Industry: ${contactData.industry || 'Not specified'}
- Title: ${contactData.title || 'Not specified'}
- Email Domain: ${contactData.emailDomain || 'Not specified'}

REQUIREMENTS:
1. Subject Line: Create a compelling, personalized subject line (max 60 characters)
2. Email Body: Write a professional, concise email (3-4 sentences) that:
   - Introduces your company briefly
   - Highlights how your products/services can help their business
   - Includes a clear call-to-action
   - Is personalized to their industry/role if possible
   - Is professional but friendly

Return ONLY a JSON object with this exact structure:
{
  "subject": "Email subject line here",
  "email": "Email body text here"
}

No additional text, no markdown, just the JSON object.`;

    try {
      const response = await this.callQwen(prompt, {
        temperature: 0.7,
        maxTokens: 500,
      });

      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      const result = JSON.parse(jsonStr);
      return {
        subject: result.subject || 'Re: Business Opportunity',
        email: result.email || 'Thank you for your interest. We would like to discuss how we can help your business.'
      };
    } catch (error) {
      logger.error('Error generating email:', error);
      // Return default email if generation fails
      return {
        subject: `Re: How ${companyProfile.companyName || 'We'} Can Help ${contactData.companyName || 'Your Business'}`,
        email: `Dear ${contactData.firstName || 'Valued Customer'},

We noticed your company ${contactData.companyName || ''} and believe our solutions could benefit your business. We specialize in ${productsInfo.substring(0, 100)} and would love to discuss how we can help you achieve your goals.

Would you be available for a brief call this week to explore how we can support your business?

Best regards,
${companyProfile.companyName || 'Our Team'}`
      };
    }
  }
}

module.exports = new QwenService();

