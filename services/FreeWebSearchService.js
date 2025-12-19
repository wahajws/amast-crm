const axios = require('axios');
const { logger } = require('../utils/logger');

class FreeWebSearchService {
  /**
   * Search using DuckDuckGo HTML interface
   */
  async search(query, numResults = 10) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const html = response.data;
      const results = this.parseDuckDuckGoResults(html, numResults);

      if (results.length === 0) {
        // Try fallback method
        return await this.searchFallback(query, numResults);
      }

      return results;
    } catch (error) {
      logger.error('DuckDuckGo search error:', error.message);
      return [];
    }
  }

  /**
   * Parse DuckDuckGo HTML results
   */
  parseDuckDuckGoResults(html, numResults) {
    const results = [];
    
    // Multiple regex patterns to handle different HTML structures
    const patterns = [
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      /<a[^>]*href="([^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
      /<a[^>]*class="[^"]*web-result[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && results.length < numResults) {
        const url = match[1];
        const titleHtml = match[2];
        
        if (url && url.startsWith('http')) {
          const title = this.extractText(titleHtml);
          if (title && title.length > 0) {
            results.push({
              title,
              url,
              snippet: '',
            });
          }
        }
      }
      
      if (results.length > 0) break;
    }

    return results.slice(0, numResults);
  }

  /**
   * Fallback search using DuckDuckGo Instant Answer API
   */
  async searchFallback(query, numResults) {
    try {
      const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await axios.get(apiUrl, { timeout: 5000 });
      
      const data = response.data;
      const results = [];

      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL || '',
          snippet: data.AbstractText,
        });
      }

      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, numResults - 1).forEach(topic => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.substring(0, 100),
              url: topic.FirstURL,
              snippet: topic.Text,
            });
          }
        });
      }

      return results.slice(0, numResults);
    } catch (error) {
      logger.error('DuckDuckGo fallback search error:', error.message);
      return [];
    }
  }

  /**
   * Extract text from HTML
   */
  extractText(html) {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = FreeWebSearchService;

