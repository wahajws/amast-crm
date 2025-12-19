const SerperService = require('./SerperService');
const GoogleCustomSearchService = require('./GoogleCustomSearchService');
const FreeWebSearchService = require('./FreeWebSearchService');
const { logger } = require('../utils/logger');

class WebSearchService {
  constructor() {
    const SerperServiceClass = require('./SerperService');
    const GoogleCustomSearchServiceClass = require('./GoogleCustomSearchService');
    const FreeWebSearchServiceClass = require('./FreeWebSearchService');
    
    this.serperService = new SerperServiceClass();
    this.googleService = new GoogleCustomSearchServiceClass();
    this.freeService = new FreeWebSearchServiceClass();
  }

  /**
   * Search with automatic fallback
   */
  async search(query, numResults = 10) {
    // Priority: Serper > Google Custom Search > Free (DuckDuckGo)
    
    // Try Serper first
    if (this.serperService.isConfigured()) {
      try {
        return await this.serperService.search(query, numResults);
      } catch (error) {
        logger.warn('Serper search failed, trying fallback:', error.message);
      }
    }

    // Try Google Custom Search
    if (this.googleService.isConfigured()) {
      try {
        return await this.googleService.search(query, numResults);
      } catch (error) {
        logger.warn('Google Custom Search failed, trying fallback:', error.message);
      }
    }

    // Fallback to free search
    try {
      return await this.freeService.search(query, numResults);
    } catch (error) {
      logger.error('All search services failed:', error.message);
      return [];
    }
  }

  /**
   * Batch search multiple queries
   */
  async batchSearch(queries, numResultsPerQuery = 10) {
    const allResults = [];
    
    for (const query of queries) {
      try {
        const results = await this.search(query, numResultsPerQuery);
        allResults.push(...results);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.error(`Error searching for "${query}":`, error.message);
      }
    }
    
    return allResults;
  }
}

module.exports = new WebSearchService();

