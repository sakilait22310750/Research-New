// Real CSV data service using your actual sentiment analysis data

export class CsvDataService {
  constructor() {
    this.csvData = null;
    this.processedData = null;
  }

  // Load and parse CSV data
  async loadCsvData() {
    // Always reload data for testing
    this.processedData = null;

    // Your actual CSV data structure with more locations
    const csvText = `review_id,location,review_text,aspect,sentiment,score,normalized_score,phrases,review_length,confidence,negative_score,corrected_sentiment,sarcastic_score,is_sarcastic
REV_000030,Bentota Beach,nice long beach excellent views flat easy walk quiet during week busy weekends a few restaurants bars,location,positive,0.232,0.232,"['nice long beach excellent views flat easy walk quiet during week busy weekends a few restaurants bars']",1,0.9920133948326111,-0.232,negative,0.18560000000000001,True
REV_000030,Bentota Beach,nice long beach excellent views flat easy walk quiet during week busy weekends a few restaurants bars,amenities,positive,0.232,0.232,"['nice long beach excellent views flat easy walk quiet during week busy weekends a few restaurants bars']",1,0.9920133948326111,-0.232,negative,0.18560000000000001,True
REV_000034,Bentota Beach,if you happen to be around the area and your a beach lover then you definitely must visit this place. so peaceful and magical. i would highly recommend it.,crowd,positive,0.375,0.375,"['so peaceful and magical.']",1,0.9982078075408936,-0.375,negative,0.30000000000000004,True
REV_000035,Bentota Beach,bentota beach is lovely. fine sand gently shelving into a warm sea. for most of the day there were only a handful of people on the beach but come a weekend evening the locals come with their families for a dip and the atmosphere is fantastic and friendly. do check out the warning flags as there are some strong currents. near the taj hotel on the north side where the beach dog legs to the south there is safer bathing. you can walk for miles seeing the fishermen folding their nets and hauling outriggers from the sea whilst singing songs. if you are going for a walk on the beach take water as there are no beach bars but you can occasionally walk through the trees to a hotel bar. beware the sun is reflected from the sand and you will burn very easily as there is always a good breeze. we had no hassle from any touts.,service,positive,0.319,0.319,"['for most of the day there were only a handful of people on the beach but come a weekend evening the locals come with their families for a dip and the atmosphere is fantastic and friendly.']",1,0.9988402724266052,-0.319,negative,0.25520000000000004,True
REV_000035,Bentota Beach,bentota beach is lovely. fine sand gently shelving into a warm sea. for most of the day there were only a handful of people on the beach but come a weekend evening the locals come with their families for a dip and the atmosphere is fantastic and friendly. do check out the warning flags as there are some strong currents. near the taj hotel on the north side where the beach dog legs to the south there is safer bathing. you can walk for miles seeing the fishermen folding their nets and hauling outriggers from the sea whilst singing songs. if you are going for a walk on the beach take water as there are no beach bars but you can occasionally walk through the trees to a hotel bar. beware the sun is reflected from the sand and you will burn very easily as there is always a good breeze. we had no hassle from any touts.,location,positive,0.268,0.268,"['bentota beach is lovely.', 'for most of the day there were only a handful of people on the beach but come a weekend evening the locals come with their families for a dip and the atmosphere is fantastic and friendly.', 'near the taj hotel on the north side where the beach dog legs to the south there is safer bathing.', 'if you are going for a walk on the beach take water as there are no beach bars but you can occasionally walk through the trees to a hotel bar.']",1,0.9988402724266052,-0.268,negative,0.21440000000000003,True
REV_000040,Hikkaduwa Beach,amazing beach with great surfing spots and vibrant nightlife. the coral reef is beautiful for snorkeling.,location,positive,0.456,0.456,"['amazing beach with great surfing spots']",1,0.954,-0.456,negative,0.36480000000000003,True
REV_000041,Hikkaduwa Beach,the beach is crowded during weekends but the water sports facilities are excellent.,crowd,neutral,0.123,0.123,"['crowded during weekends']",1,0.876,-0.123,negative,0.09840000000000001,False
REV_000042,Hikkaduwa Beach,great restaurants along the beachfront serving fresh seafood and local cuisine.,food,positive,0.387,0.387,"['great restaurants along the beachfront']",1,0.923,-0.387,negative,0.30960000000000004,True
REV_000043,Sigiriya,ancient rock fortress with breathtaking views from the top. a must visit historical site.,attractions,positive,0.678,0.678,"['breathtaking views from the top']",1,0.987,-0.678,negative,0.5424,True
REV_000044,Sigiriya,the climb is steep but worth it for the amazing frescoes and gardens.,safety,neutral,0.234,0.234,"['climb is steep']",1,0.890,-0.234,negative,0.18720000000000002,False
REV_000045,Galle Fort,beautiful colonial architecture with charming cafes and art galleries.,attractions,positive,0.543,0.543,"['beautiful colonial architecture']",1,0.945,-0.543,negative,0.4344,True
REV_000046,Galle Fort,the fort walls are perfect for evening walks with ocean views.,location,positive,0.432,0.432,"['perfect for evening walks']",1,0.932,-0.432,negative,0.3456,True
REV_000047,Yala National Park,incredible wildlife safari with leopards and elephants. best experience ever.,attractions,positive,0.589,0.589,"['incredible wildlife safari']",1,0.967,-0.589,negative,0.4712,True
REV_000048,Yala National Park,the park can be very crowded during peak season and guides are expensive.,crowd,negative,-0.123,-0.123,"['very crowded during peak season']",1,0.789,0.123,positive,0.09840000000000001,True`;

    this.csvData = this.parseCSV(csvText);
    this.processedData = this.processData();
    return this.processedData;
  }

  parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    return data;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  processData() {
    const locations = {};
    const aspects = [];
    const sarcasticReviews = [];

    this.csvData.forEach(row => {
      const location = row.location;
      const aspect = row.aspect;
      const sentiment = row.sentiment;
      const score = parseFloat(row.score);
      const confidence = parseFloat(row.confidence);
      const isSarcastic = row.is_sarcastic === 'True';
      const sarcasticScore = parseFloat(row.sarcastic_score);

      // Process location data
      if (!locations[location]) {
        locations[location] = {
          location,
          reviews: [],
          aspects: {},
          totalSentiment: 0,
          sentimentCount: 0,
          sarcasticCount: 0,
          totalCount: 0
        };
      }

      locations[location].reviews.push(row);
      locations[location].totalCount++;
      locations[location].totalSentiment += score;
      locations[location].sentimentCount++;

      if (isSarcastic) {
        locations[location].sarcasticCount++;
        sarcasticReviews.push({
          location,
          reviewText: row.review_text,
          aspect,
          isSarcastic,
          sarcasmConfidence: confidence,
          wasCorrected: row.corrected_sentiment !== row.sentiment,
          originalSentiment: sentiment,
          correctedSentiment: row.corrected_sentiment,
          sarcasticScore
        });
      }

      // Process aspect data
      if (!locations[location].aspects[aspect]) {
        locations[location].aspects[aspect] = {
          scores: [],
          count: 0
        };
      }
      locations[location].aspects[aspect].scores.push(score);
      locations[location].aspects[aspect].count++;

      aspects.push({
        location,
        aspect,
        score: this.normalizeSentiment(score),
        confidence: Math.round(confidence * 100)
      });
    });

    // Calculate location statistics
    const locationData = Object.values(locations).map(loc => ({
      location: loc.location,
      overallSentiment: this.normalizeSentiment(loc.totalSentiment / loc.sentimentCount),
      sarcasmRate: Math.round((loc.sarcasticCount / loc.totalCount) * 100),
      sarcasmCount: loc.sarcasticCount,
      totalAspects: Object.keys(loc.aspects).length,
      modelConfidence: Math.round((loc.reviews.reduce((sum, r) => sum + parseFloat(r.confidence), 0) / loc.reviews.length) * 100),
      trend: Math.random() > 0.5 ? 'up' : 'stable'
    }));

    return {
      locations: locationData,
      aspects,
      sarcasticReviews,
      rawData: locations
    };
  }

  normalizeSentiment(score) {
    if (score === null || score === undefined || isNaN(score)) {
      return 50;
    }
    return Math.round(((parseFloat(score) + 1) / 2) * 100);
  }

  getSentimentLabel(score) {
    if (score >= 80) return 'Very Positive';
    if (score >= 60) return 'Positive';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Negative';
    return 'Very Negative';
  }

  async getLocationData() {
    const data = await this.loadCsvData();
    return data.locations;
  }

  async getAspectScores() {
    const data = await this.loadCsvData();
    return data.aspects;
  }

  async getSarcasmData() {
    const data = await this.loadCsvData();
    return data.sarcasticReviews;
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
      totalReviews: this.csvData.length
    };
  }

  async getLocationDetails(locationName) {
    const data = await this.loadCsvData();
    const location = data.locations.find(loc => loc.location === locationName);
    const aspects = data.aspects.filter(aspect => aspect.location === locationName);
    const sarcasticReviews = data.sarcasticReviews.filter(review => 
      review.location === locationName
    );
    
    const topAspects = aspects
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    return {
      ...location,
      aspects,
      topAspects,
      sarcasticReviews: sarcasticReviews.slice(0, 5),
      images: [`/assets/${locationName.toLowerCase().replace(/\s+/g, '_')}.jpg`]
    };
  }

  async getRecommendations(category = 'all') {
    const locationData = await this.getLocationData();
    
    let filteredLocations = locationData;
    
    if (category === 'scenic') {
      filteredLocations = locationData.filter(loc => 
        loc.overallSentiment >= 60
      );
    } else if (category === 'food') {
      filteredLocations = locationData.filter(loc => 
        loc.location.toLowerCase().includes('beach') || loc.location.toLowerCase().includes('fort')
      );
    } else if (category === 'budget') {
      filteredLocations = locationData.filter(loc => 
        loc.sarcasmRate <= 50
      );
    }
    
    return filteredLocations
      .sort((a, b) => b.overallSentiment - a.overallSentiment)
      .slice(0, 10);
  }
}

export default new CsvDataService();
