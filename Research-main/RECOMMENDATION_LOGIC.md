# Recommendation System Logic Explanation

## Overview
This app uses a **hybrid recommendation system** that combines three different approaches to suggest hotels to users:
1. **Collaborative Filtering** (50% weight)
2. **NLP Sentiment Analysis** (30% weight)
3. **VGG Image Similarity** (20% weight)

---

## Complete Flow Diagram

```
User Opens Recommendations Tab
         ↓
Frontend: recommendations.tsx
    - Checks if user is logged in
    - Gets user ID and auth token
         ↓
Frontend: api.getRecommendations()
    - Sends POST request to /api/recommendations
    - Includes: user_id, location (optional), limit (default: 20)
         ↓
Backend: /api/recommendations endpoint
    - Authenticates user (requires JWT token)
    - Fetches hotels from MongoDB (optionally filtered by location)
         ↓
Backend: RecommendationEngine.hybrid_recommendation_with_vgg()
    - Calculates recommendation scores using 3 methods
         ↓
Backend: Returns sorted list of hotel IDs
         ↓
Backend: Fetches full hotel details for each ID
         ↓
Frontend: Receives hotel list and displays them
```

---

## Backend Recommendation Algorithm

### Step 1: Filter Hotels (if location provided)
```python
# If user specified a location, filter hotels
if request.location:
    query['location'] = {"$regex": request.location, "$options": "i"}
hotels = await db.hotels.find(query).to_list(200)
```

### Step 2: Check for Cold Start Problem
**Cold Start** = New user with no history

```python
if user_id not in self.user_similarity.index:
    # User is new - use popularity-based recommendations
    score = hotel['rating'] * 0.6 + (sentiment + 1) * 2.0
    # Return top N hotels sorted by this score
```

**For new users:**
- Score = `(Rating × 0.6) + ((Sentiment + 1) × 2.0)`
- Returns hotels sorted by this popularity score

### Step 3: Find Similar Users (Collaborative Filtering)
```python
# Find top 5 users with similar preferences
similar_users = self.user_similarity[user_id].sort_values(ascending=False)[1:6]
```

**How it works:**
- Compares user's past hotel interactions with other users
- Finds users who liked similar hotels
- Uses cosine similarity to measure how similar users are

### Step 4: Calculate Collaborative Filtering Scores
```python
# For each hotel, calculate score based on similar users' preferences
for similar_user, similarity_score in similar_users.items():
    for hotel_id in hotel_ids:
        if similar_user liked this hotel:
            cf_scores[hotel_id] += similarity_score × rating
```

**Formula:**
- If User A is 80% similar to you and liked Hotel X (rating 5)
- Hotel X gets: `0.8 × 5 = 4.0` points from User A
- Sum scores from all similar users

### Step 5: Remove Already-Seen Hotels
```python
# Don't recommend hotels the user has already interacted with
seen_hotel_ids = self.user_hotel_matrix.loc[user_id]
cf_scores = cf_scores[seen_hotel_ids == 0]  # Only unseen hotels
```

### Step 6: Calculate NLP Sentiment Scores
```python
# Use average sentiment from hotel reviews
nlp_scores = pd.Series({h['hotel_id']: h['avg_sentiment_score'] for h in hotels})
```

**What is sentiment score?**
- Analyzes all reviews for a hotel
- Calculates average sentiment (positive/negative)
- Range: typically -1 (very negative) to +1 (very positive)

### Step 7: Calculate VGG Image Similarity Scores
```python
# Get hotels user previously liked
user_hotels = self.train_df[self.train_df['user_id'] == user_id]['hotel_id'].unique()
user_vecs = [self.img_df[h] for h in user_hotels if h in self.img_df]

# For each candidate hotel, calculate image similarity
for hotel_id in candidate_hotels:
    hotel_vec = self.img_df[hotel_id]  # VGG features of hotel image
    similarity = cosine_similarity(hotel_vec, user_vecs).mean()
    img_scores.append(similarity)
```

**How it works:**
- Uses VGG neural network to extract features from hotel images
- Compares visual features of candidate hotels with hotels user liked
- Higher similarity = hotel looks similar to what user prefers

### Step 8: Combine All Scores (Hybrid Approach)
```python
final_score = (
    alpha * cf_scores +      # 50% weight (collaborative filtering)
    beta * nlp_scores +      # 30% weight (sentiment analysis)
    gamma * img_scores       # 20% weight (image similarity)
)
```

**Default Weights:**
- `alpha = 0.5` (50%) - Collaborative Filtering
- `beta = 0.3` (30%) - NLP Sentiment
- `gamma = 0.2` (20%) - Image Similarity

**Example Calculation:**
```
Hotel X:
  CF Score: 0.8 (normalized)
  NLP Score: 0.6 (sentiment)
  Image Score: 0.7 (similarity)

Final Score = (0.5 × 0.8) + (0.3 × 0.6) + (0.2 × 0.7)
            = 0.40 + 0.18 + 0.14
            = 0.72
```

### Step 9: Sort and Return Top N
```python
# Sort hotels by final score (highest first)
return final_score.sort_values(ascending=False).head(top_n).index.tolist()
```

---

## Frontend Recommendation Display

### File: `frontend/app/(tabs)/recommendations.tsx`

### Step 1: Component Mounts
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    loadHotels();
  }, 500); // Wait for auth state to load
}, [params, token, user]);
```

### Step 2: Load Recommendations
```typescript
const loadHotels = async () => {
  // 1. Check if user is logged in
  if (!token || !user) {
    setError('Please log in to see recommendations');
    return;
  }

  // 2. Call API
  const data = await api.getRecommendations(
    user.id,      // User ID
    token,        // Auth token
    location,     // Optional location filter
    20            // Limit: 20 hotels
  );
}
```

### Step 3: Fallback Mechanism
If no recommendations are returned, the app tries multiple fallbacks:

```typescript
// Fallback 1: Try with location and rating filters
fallbackHotels = await api.getHotels(location, minRating, token);

// Fallback 2: Try without location filter
if (!fallbackHotels) {
  fallbackHotels = await api.getHotels(undefined, minRating, token);
}

// Fallback 3: Get all hotels
if (!fallbackHotels) {
  fallbackHotels = await api.getHotels(undefined, undefined, token);
}
```

**Why fallbacks?**
- Ensures users always see something
- Handles edge cases (new users, no data, etc.)
- Better user experience

### Step 4: Display Hotels
```typescript
<FlatList
  data={hotels}
  renderItem={renderHotel}  // Renders each hotel card
  keyExtractor={(item) => item.id}
/>
```

Each hotel card shows:
- Hotel image (loaded from Google Drive)
- Hotel name
- Location
- Rating (stars)
- Amenities (Pool, WiFi, Restaurant)
- "Book Now" button

---

## Data Structures Used

### User-Hotel Matrix
```
        Hotel1  Hotel2  Hotel3  Hotel4
User1     5       0       4       0
User2     0       3       5       4
User3     4       5       0       3
```
- Rows = Users
- Columns = Hotels
- Values = Ratings (0 = not interacted, 1-5 = rating)

### User Similarity Matrix
```
        User1  User2  User3
User1    1.0   0.7    0.3
User2    0.7   1.0    0.5
User3    0.3   0.5    1.0
```
- Measures how similar users are (0-1 scale)
- Calculated using cosine similarity

### VGG Image Features
- Each hotel image → 4096-dimensional feature vector
- Extracted using pre-trained VGG neural network
- Used to compare visual similarity between hotels

---

## Key Features

### 1. **Personalization**
- Recommendations are unique to each user
- Based on their past interactions and preferences

### 2. **Multi-Factor Scoring**
- Not just ratings - considers sentiment and visual preferences
- Balances multiple signals for better recommendations

### 3. **Cold Start Handling**
- New users get popular hotels (rating + sentiment)
- System learns as user interacts more

### 4. **Location Filtering**
- Users can filter by location
- Recommendations respect location preference

### 5. **Robust Error Handling**
- Multiple fallback mechanisms
- Graceful degradation if recommendations fail

---

## Example Scenario

**User Profile:**
- User ID: "user123"
- Previously liked: Hotels with pools, high ratings, beach locations

**Recommendation Process:**
1. System finds 5 similar users who also like beach hotels with pools
2. Those users liked: Hotel A (rating 5), Hotel B (rating 4), Hotel C (rating 5)
3. Collaborative Filtering gives high scores to A, B, C
4. NLP checks sentiment: Hotel A has +0.8 sentiment (very positive reviews)
5. Image similarity: Hotel A's images are visually similar to user's liked hotels
6. Final score: Hotel A gets highest combined score
7. Hotel A appears at top of recommendations

---

## API Endpoints

### POST `/api/recommendations`
**Request:**
```json
{
  "user_id": "user123",
  "location": "Hikkaduwa",  // Optional
  "limit": 20                // Optional, default: 10
}
```

**Response:**
```json
[
  {
    "id": "hotel_id_1",
    "hotel_id": 123,
    "name": "Riff Hikkaduwa",
    "location": "Hikkaduwa, Galle District",
    "rating": 5.0,
    "total_reviews": 150,
    "avg_sentiment_score": 0.75,
    "recommendation_score": 100.0,
    "image_url": "/api/hotel-image/123"
  },
  ...
]
```

---

## Performance Optimizations

1. **Caching**: User similarity matrix is pre-computed
2. **Limiting**: Only processes top 200 hotels
3. **Normalization**: Scores are normalized to 0-1 range
4. **Early Returns**: Cold start users get quick results
5. **Database Indexing**: Fast hotel lookups by location

---

## Future Improvements

1. **Real-time Learning**: Update recommendations as user interacts
2. **A/B Testing**: Test different weight combinations
3. **Contextual Recommendations**: Consider time, season, events
4. **Explainability**: Show why each hotel was recommended
5. **Diversity**: Ensure recommendations aren't too similar

---

## Summary

The recommendation system is a **sophisticated hybrid approach** that:
- ✅ Learns from user behavior (collaborative filtering)
- ✅ Considers review sentiment (NLP)
- ✅ Matches visual preferences (image similarity)
- ✅ Handles new users gracefully (cold start)
- ✅ Provides fallbacks for reliability

This ensures users get **personalized, relevant hotel recommendations** that match their preferences and past behavior.







