const axios = require('axios');
const { logger } = require('../utils/logger');

class SerperService {
  constructor() {
    this.apiKey = process.env.SERPER_API_KEY;
  }

  /**
   * Check if Serper API is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Search using Serper API
   */
  async search(query, numResults = 10) {
    if (!this.isConfigured()) {
      throw new Error('Serper API key is not configured. Please set SERPER_API_KEY environment variable.');
    }

    try {
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: query,
          num: numResults,
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const results = [];
      
      if (response.data.organic) {
        response.data.organic.forEach(item => {
          results.push({
            title: item.title,
            url: item.link,
            snippet: item.snippet || '',
          });
        });
      }

      return results;
    } catch (error) {
      logger.error('Serper API error:', error.message);
      throw error;
    }
  }
}

module.exports = SerperService;

