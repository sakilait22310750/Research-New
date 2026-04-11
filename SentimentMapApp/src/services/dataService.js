import * as FileSystem from 'expo-file-system';
import { parse } from 'csv-parse/sync';

export class DataService {
  constructor() {
    this.dataDirectory = `${FileSystem.documentDirectory}data/`;
    this.cache = {};
  }

  async loadDataFile(filename) {
    if (this.cache[filename]) {
      return this.cache[filename];
    }

    try {
      // Try to load from app's data directory first
      const fileUri = `${this.dataDirectory}${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        this.cache[filename] = this.parseData(filename, content);
        return this.cache[filename];
      }
      
      // Fallback to project data folder (development)
      const projectFileUri = `${FileSystem.bundleDirectory}/../data/${filename}`;
      const projectFileInfo = await FileSystem.getInfoAsync(projectFileUri);
      
      if (projectFileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(projectFileUri);
        this.cache[filename] = this.parseData(filename, content);
        return this.cache[filename];
      }
      
      throw new Error(`Data file ${filename} not found`);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      throw error;
    }
  }

  parseData(filename, content) {
    if (filename.endsWith('.json')) {
      return JSON.parse(content);
    } else if (filename.endsWith('.csv')) {
      return parse(content, {
        columns: true,
        skip_empty_lines: true
      });
    }
    return content;
  }

  async getLocationData() {
    const data = await this.loadDataFile('final_multimodal_location_analysis.csv');
    return data.map(row => ({
      location: row.location,
      overallSentiment: this.normalizeSentiment(row.pred_fused_overall),
      sarcasmRate: parseFloat(row.sarcasm_rate) || 0,
      sarcasmCount: parseInt(row.sarcasm_count) || 0,
      totalAspects: parseInt(row.total_aspects) || 0,
      modelConfidence: this.calculateConfidence(row),
      trend: this.calculateTrend(row)
    }));
  }

  async getAspectScores() {
    const data = await this.loadDataFile('location_aspect_scores.csv');
    return data.map(row => ({
      location: row.location,
      aspect: row.aspect,
      score: this.normalizeSentiment(parseFloat(row.avg_polarity)),
      confidence: parseFloat(row.avg_confidence) || 0
    }));
  }

  async getSarcasmData() {
    const data = await this.loadDataFile('absa_corrected_for_sarcasm.csv');
    return data.map(row => ({
      location: row.location,
      reviewText: row.review_text_clean,
      aspect: row.aspect,
      isSarcastic: row.is_sarcastic === '1',
      sarcasmConfidence: parseFloat(row.sarcasm_confidence) || 0,
      wasCorrected: row.was_corrected === 'True',
      originalSentiment: row.sentiment,
      correctedSentiment: row.sentiment_corrected
    }));
  }

  async getImageMapping() {
    return await this.loadDataFile('image_mapping.json');
  }

  normalizeSentiment(score) {
    // Convert -1 to 1 range to 0-100 percentage
    if (score === null || score === undefined || isNaN(score)) {
      return 50; // Neutral
    }
    return Math.round(((parseFloat(score) + 1) / 2) * 100);
  }

  calculateConfidence(row) {
    // Calculate model confidence based on various factors
    const textConf = Math.abs(parseFloat(row.pred_text_overall)) || 0;
    const imageConf = Math.abs(parseFloat(row.pred_image_overall)) || 0;
    const fusedConf = Math.abs(parseFloat(row.pred_fused_overall)) || 0;
    return Math.round(((textConf + imageConf + fusedConf) / 3) * 100);
  }

  calculateTrend(row) {
    // Calculate trend based on text-image gap
    const gap = parseFloat(row.text_image_gap) || 0;
    if (gap > 0.1) return 'up';
    if (gap < -0.1) return 'down';
    return 'stable';
  }

  getSentimentLabel(score) {
    if (score >= 80) return 'Very Positive';
    if (score >= 60) return 'Positive';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Negative';
    return 'Very Negative';
  }

  async getDashboardStats() {
    const locationData = await this.getLocationData();
    const aspectData = await this.getAspectScores();
    
    const totalLocations = locationData.length;
    const avgSentiment = Math.round(
      locationData.reduce((sum, loc) => sum + loc.overallSentiment, 0) / totalLocations
    );
    const positivePercentage = Math.round(
      (locationData.filter(loc => loc.overallSentiment >= 60).length / totalLocations) * 100
    );
    
    return {
      totalLocations,
      avgSentiment,
      positivePercentage,
      totalReviews: aspectData.length
    };
  }

  async getLocationDetails(locationName) {
    const locationData = await this.getLocationData();
    const aspectData = await this.getAspectScores();
    const sarcasmData = await this.getSarcasmData();
    const imageMapping = await this.getImageMapping();
    
    const location = locationData.find(loc => loc.location === locationName);
    const aspects = aspectData.filter(aspect => aspect.location === locationName);
    const sarcasticReviews = sarcasmData.filter(review => 
      review.location === locationName && review.isSarcastic
    );
    const images = imageMapping[locationName] || [];
    
    // Get top 3 aspects
    const topAspects = aspects
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    return {
      ...location,
      aspects,
      topAspects,
      sarcasticReviews: sarcasticReviews.slice(0, 2), // Show 2 examples
      images
    };
  }

  async getRecommendations(category = 'all') {
    const locationData = await this.getLocationData();
    const aspectData = await this.getAspectScores();
    
    let filteredLocations = locationData;
    
    if (category === 'scenic') {
      // Filter by attractions and view aspects
      const scenicAspects = aspectData.filter(a => 
        a.aspect === 'attractions' || a.aspect === 'view'
      );
      const scenicLocations = [...new Set(scenicAspects.map(a => a.location))];
      filteredLocations = locationData.filter(loc => scenicLocations.includes(loc.location));
    } else if (category === 'food') {
      // Filter by food aspect
      const foodAspects = aspectData.filter(a => a.aspect === 'food');
      const foodLocations = [...new Set(foodAspects.map(a => a.location))];
      filteredLocations = locationData.filter(loc => foodLocations.includes(loc.location));
    } else if (category === 'budget') {
      // Filter by value aspect
      const valueAspects = aspectData.filter(a => a.aspect === 'value');
      const budgetLocations = [...new Set(valueAspects.map(a => a.location))];
      filteredLocations = locationData.filter(loc => budgetLocations.includes(loc.location));
    }
    
    // Sort by sentiment and return top recommendations
    return filteredLocations
      .sort((a, b) => b.overallSentiment - a.overallSentiment)
      .slice(0, 10);
  }
}

export default new DataService();
