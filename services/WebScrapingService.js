const axios = require('axios');
const { logger } = require('../utils/logger');

class WebScrapingService {
  /**
   * Scrape website content
   */
  async scrapeWebsite(url) {
    try {
      // Normalize URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        maxRedirects: 5,
      });

      const html = response.data;
      
      return {
        content: this.extractText(html),
        title: this.extractTitle(html),
        metaDescription: this.extractMetaDescription(html),
        metaKeywords: this.extractMetaKeywords(html),
        error: null,
      };
    } catch (error) {
      logger.error('Error scraping website:', error.message);
      return {
        content: '',
        title: '',
        metaDescription: '',
        metaKeywords: '',
        error: error.message,
      };
    }
  }

  /**
   * Extract text content from HTML
   */
  extractText(html) {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text.substring(0, 10000); // Limit to 10k chars
  }

  /**
   * Extract page title
   */
  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      return this.decodeHtmlEntities(titleMatch[1].trim());
    }
    return '';
  }

  /**
   * Extract meta description
   */
  extractMetaDescription(html) {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (descMatch) {
      return this.decodeHtmlEntities(descMatch[1].trim());
    }
    return '';
  }

  /**
   * Extract meta keywords
   */
  extractMetaKeywords(html) {
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i);
    if (keywordsMatch) {
      return this.decodeHtmlEntities(keywordsMatch[1].trim());
    }
    return '';
  }

  /**
   * Extract key sections from HTML
   */
  extractKeySections(scrapedData) {
    const html = scrapedData.html || '';
    return {
      about: this.extractSection(html, ['about', 'company', 'who we are']),
      products: this.extractSection(html, ['products', 'services', 'solutions']),
      services: this.extractSection(html, ['services', 'what we do']),
      contact: this.extractSection(html, ['contact', 'get in touch']),
    };
  }

  /**
   * Extract section by keywords
   */
  extractSection(html, keywords) {
    // Simple extraction - look for headings containing keywords
    for (const keyword of keywords) {
      const regex = new RegExp(`<h[1-6][^>]*>.*?${keyword}.*?<\/h[1-6]>[\s\S]*?<p[^>]*>([\s\S]{0,500})<\/p>`, 'i');
      const match = html.match(regex);
      if (match) {
        return this.extractText(match[1]);
      }
    }
    return '';
  }

  /**
   * Extract contact information
   */
  extractContactInfo(scrapedData) {
    const html = scrapedData.html || '';
    const text = this.extractText(html);
    
    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : null;
    
    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : null;
    
    return {
      email,
      phone,
      address: null,
    };
  }

  /**
   * Decode HTML entities
   */
  decodeHtmlEntities(text) {
    const entities = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
    };
    
    return text.replace(/&[#\w]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }
}

module.exports = new WebScrapingService();

