// Mock data service for testing - provides sample data without file dependencies

export class MockDataService {
  constructor() {
    this.mockData = {
      locations: [
        {
          location: "Bentota Beach",
          overallSentiment: 45,
          sarcasmRate: 53,
          sarcasmCount: 477,
          totalAspects: 892,
          modelConfidence: 78,
          trend: 'stable'
        },
        {
          location: "Sigiriya",
          overallSentiment: 43,
          sarcasmRate: 57,
          sarcasmCount: 48,
          totalAspects: 660,
          modelConfidence: 75,
          trend: 'up'
        },
        {
          location: "Galle Fort",
          overallSentiment: 50,
          sarcasmRate: 43,
          sarcasmCount: 353,
          totalAspects: 818,
          modelConfidence: 82,
          trend: 'stable'
        },
        {
          location: "Yala National Park",
          overallSentiment: 38,
          sarcasmRate: 75,
          sarcasmCount: 48,
          totalAspects: 480,
          modelConfidence: 70,
          trend: 'up'
        }
      ],
      aspects: [
        { location: "Bentota Beach", aspect: "cleanliness", score: 69, confidence: 37 },
        { location: "Bentota Beach", aspect: "food", score: 70, confidence: 41 },
        { location: "Bentota Beach", aspect: "location", score: 67, confidence: 34 },
        { location: "Sigiriya", aspect: "attractions", score: 85, confidence: 90 },
        { location: "Sigiriya", aspect: "safety", score: 78, confidence: 85 },
        { location: "Sigiriya", aspect: "view", score: 92, confidence: 88 }
      ],
      sarcasticReviews: [
        {
          location: "Bentota Beach",
          reviewText: "beautiful beach so clean. golden sand and a beach so peaceful and tranquil.",
          aspect: "cleanliness",
          isSarcastic: true,
          sarcasmConfidence: 0.99,
          wasCorrected: true,
          originalSentiment: "positive",
          correctedSentiment: "negative"
        },
        {
          location: "Sigiriya", 
          reviewText: "Just a 'small hill' to climb for the view",
          aspect: "attractions",
          isSarcastic: true,
          sarcasmConfidence: 0.95,
          wasCorrected: true,
          originalSentiment: "positive", 
          correctedSentiment: "negative"
        }
      ]
    };
  }

  async getLocationData() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.mockData.locations), 500);
    });
  }

  async getAspectScores() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.mockData.aspects), 500);
    });
  }

  async getSarcasmData() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.mockData.sarcasticReviews), 500);
    });
  }

  async getImageMapping() {
    return new Promise(resolve => {
      setTimeout(() => resolve({
        "Bentota Beach": ["image1.jpg", "image2.jpg"],
        "Sigiriya": ["image3.jpg", "image4.jpg"]
      }), 500);
    });
  }

  normalizeSentiment(score) {
    if (score === null || score === undefined || isNaN(score)) {
      return 50;
    }
    return Math.round(((parseFloat(score) + 1) / 2) * 100);
  }

  calculateConfidence(row) {
    return Math.round(Math.random() * 30 + 70); // Mock confidence 70-100%
  }

  calculateTrend(row) {
    return Math.random() > 0.5 ? 'up' : 'stable';
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
      totalReviews: 1200 // Mock number
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
    
    const topAspects = aspects
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    return {
      ...location,
      aspects,
      topAspects,
      sarcasticReviews: sarcasticReviews.slice(0, 2),
      images
    };
  }

  async getRecommendations(category = 'all') {
    const locationData = await this.getLocationData();
    const aspectData = await this.getAspectScores();
    
    let filteredLocations = locationData;
    
    if (category === 'scenic') {
      filteredLocations = locationData.filter(loc => 
        ['Sigiriya', 'Yala National Park'].includes(loc.location)
      );
    } else if (category === 'food') {
      filteredLocations = locationData.filter(loc => 
        ['Bentota Beach', 'Galle Fort'].includes(loc.location)
      );
    } else if (category === 'budget') {
      filteredLocations = locationData.slice(0, 2);
    }
    
    return filteredLocations
      .sort((a, b) => b.overallSentiment - a.overallSentiment)
      .slice(0, 10);
  }
}

export default new MockDataService();
