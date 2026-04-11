// Real-time search service for CSV data

export class SearchService {
  constructor() {
    this.searchHistory = [];
    this.popularSearches = ['beach', 'temple', 'fort', 'park', 'mountain'];
  }

  // Search through all CSV data in real-time
  async searchLocations(query, csvDataService) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Load all CSV data
      const data = await csvDataService.loadCsvData();
      const locations = data.locations;
      const rawData = data.rawData;

      const searchQuery = query.toLowerCase().trim();
      const results = [];

      // Search through location names
      locations.forEach(location => {
        const locationName = location.location.toLowerCase();
        if (locationName.includes(searchQuery)) {
          results.push({
            type: 'location',
            data: location,
            matchType: 'exact',
            score: this.calculateMatchScore(locationName, searchQuery)
          });
        }
      });

      // Search through review text for location mentions
      Object.keys(rawData).forEach(locationName => {
        const locationData = rawData[locationName];
        locationData.reviews.forEach(review => {
          const reviewText = review.review_text.toLowerCase();
          if (reviewText.includes(searchQuery) && !results.find(r => r.data.location === locationName)) {
            const locationInfo = locations.find(loc => loc.location === locationName);
            if (locationInfo) {
              results.push({
                type: 'review',
                data: locationInfo,
                matchType: 'review',
                score: this.calculateMatchScore(reviewText, searchQuery) * 0.8,
                matchingReview: review,
                context: this.extractContext(review.review_text, searchQuery)
              });
            }
          }
        });
      });

      // Search through aspects
      Object.keys(rawData).forEach(locationName => {
        const locationData = rawData[locationName];
        Object.keys(locationData.aspects).forEach(aspect => {
          if (aspect.toLowerCase().includes(searchQuery)) {
            const locationInfo = locations.find(loc => loc.location === locationName);
            if (locationInfo && !results.find(r => r.data.location === locationName)) {
              results.push({
                type: 'aspect',
                data: locationInfo,
                matchType: 'aspect',
                score: this.calculateMatchScore(aspect.toLowerCase(), searchQuery) * 0.9,
                matchingAspect: aspect
              });
            }
          }
        });
      });

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score);

      // Add to search history
      this.addToHistory(query);

      return results.slice(0, 10); // Limit to 10 results

    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  // Calculate how well the query matches
  calculateMatchScore(text, query) {
    if (text === query) return 100;
    if (text.startsWith(query)) return 90;
    if (text.includes(query)) return 70;
    
    // Fuzzy matching for partial words
    const words = text.split(' ');
    const queryWords = query.split(' ');
    let matchScore = 0;
    
    queryWords.forEach(queryWord => {
      words.forEach(word => {
        if (word.includes(queryWord)) {
          matchScore += 30;
        }
      });
    });
    
    return Math.min(matchScore, 60);
  }

  // Extract context around matched text
  extractContext(text, query, contextLength = 50) {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.substring(0, 100);
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);
    
    let context = text.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  // Get recommendations based on search
  async getRecommendationsForSearch(query, csvDataService) {
    const searchResults = await this.searchLocations(query, csvDataService);
    
    if (searchResults.length === 0) {
      return this.getFallbackRecommendations(csvDataService);
    }

    // Get similar locations based on the first search result
    const primaryLocation = searchResults[0].data;
    const allLocations = await csvDataService.getLocationData();
    
    // Find similar locations based on sentiment and aspects
    const similar = allLocations
      .filter(loc => loc.location !== primaryLocation.location)
      .map(loc => ({
        ...loc,
        similarityScore: this.calculateSimilarity(primaryLocation, loc)
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);

    return {
      searchResults,
      similarLocations: similar,
      searchQuery: query
    };
  }

  // Calculate similarity between two locations
  calculateSimilarity(loc1, loc2) {
    let score = 0;
    
    // Sentiment similarity
    const sentimentDiff = Math.abs(loc1.overallSentiment - loc2.overallSentiment);
    score += (100 - sentimentDiff) * 0.4;
    
    // Sarcasm rate similarity
    const sarcasmDiff = Math.abs(loc1.sarcasmRate - loc2.sarcasmRate);
    score += (100 - sarcasmDiff) * 0.2;
    
    // Model confidence similarity
    const confidenceDiff = Math.abs(loc1.modelConfidence - loc2.modelConfidence);
    score += (100 - confidenceDiff) * 0.2;
    
    // Trend similarity
    if (loc1.trend === loc2.trend) score += 20;
    
    return score;
  }

  // Get fallback recommendations when no search results
  async getFallbackRecommendations(csvDataService) {
    const locations = await csvDataService.getLocationData();
    return {
      searchResults: [],
      similarLocations: locations.slice(0, 5),
      searchQuery: '',
      isFallback: true
    };
  }

  // Add to search history
  addToHistory(query) {
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    this.searchHistory.unshift(query);
    this.searchHistory = this.searchHistory.slice(0, 10);
  }

  // Get search suggestions
  getSearchSuggestions(query) {
    if (!query || query.length < 2) {
      return this.popularSearches;
    }

    const suggestions = this.searchHistory.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    );

    return suggestions.slice(0, 5);
  }

  // Get trending searches based on current data
  async getTrendingSearches(csvDataService) {
    try {
      const data = await csvDataService.loadCsvData();
      const locations = data.locations;
      
      // Return top locations by sentiment
      return locations
        .sort((a, b) => b.overallSentiment - a.overallSentiment)
        .slice(0, 5)
        .map(loc => loc.location);
    } catch (error) {
      return this.popularSearches;
    }
  }
}

export default new SearchService();
