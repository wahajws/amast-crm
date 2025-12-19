const axios = require('axios');
const { logger } = require('../utils/logger');

class GoogleCustomSearchService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  }

  /**
   * Check if Google Custom Search is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.engineId);
  }

  /**
   * Perform search using Google Custom Search API
   */
  async search(query, numResults = 10) {
    if (!this.isConfigured()) {
      throw new Error('Google Custom Search API is not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.');
    }

    try {
      const url = 'https://www.googleapis.com/customsearch/v1';
      const params = {
        key: this.apiKey,
        cx: this.engineId,
        q: query,
        num: Math.min(numResults, 10), // Google API max is 10 per request
      };

      const response = await axios.get(url, { params, timeout: 10000 });
      
      if (!response.data.items) {
        return [];
      }

      return response.data.items.map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || '',
      }));
    } catch (error) {
      logger.error('Google Custom Search error:', error.message);
      throw error;
    }
  }
}

module.exports = GoogleCustomSearchService;

