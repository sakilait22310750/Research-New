import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import hotelApiService from '../services/hotelApiService';

const HotelRecommendationsListScreen = ({ route, navigation }) => {
  const { location, rating, amenities } = route.params || {};
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  const loadHotels = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let minRating;
      if (rating && typeof rating === 'string' && rating !== 'Any Rating') {
        minRating = parseFloat(rating.replace('+', ''));
      }

      const data = await hotelApiService.getHotelRecommendations({
        location: location || undefined,
        limit: 30,
        minRating: minRating ?? 3.5,
        amenities: Array.isArray(amenities) ? amenities : [],
      });

      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[HotelRecommendationsList] Error loading hotels:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [location, rating, amenities]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHotels();
  };

  const renderHotel = ({ item }) => {
    const ratingValue = item.rating ?? 0;
    const sentiment = item.avg_sentiment_score ?? 0;

    return (
      <TouchableOpacity
        style={styles.hotelCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('HotelDetail', {
            hotelId: item.hotel_id,
          })
        }
      >
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.hotelImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="bed" size={40} color="#10b981" />
            </View>
          )}
          <View className="priceTag" style={styles.priceTag}>
            <Text style={styles.priceText}>$85/USD</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.hotelName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.location} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={
                    star <= Math.floor(ratingValue) ? 'star' : 'star-outline'
                  }
                  size={14}
                  color="#f59e0b"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={14}
                color="#10b981"
              />
              <Text style={styles.metaText}>
                {item.total_reviews ?? 0} reviews
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="happy-outline" size={14} color="#0ea5e9" />
              <Text style={styles.metaText}>
                Sentiment: {(sentiment * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() =>
              navigation.navigate('BookingDetails', {
                hotelId: item.hotel_id,
                hotelName: item.name,
                location: item.location,
                nightlyRate: 85,
              })
            }
          >
            <Text style={styles.bookButtonText}>Book Now - $85/night</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended accommodations</Text>
        <Text style={styles.count}>{hotels.length} properties found</Text>
      </View>

      {hotels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No accommodations found</Text>
          <Text style={styles.emptySubtext}>
            {error || 'Try adjusting your filters or check back later.'}
          </Text>
          {error && (
            <TouchableOpacity style={styles.retryButton} onPress={loadHotels}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={hotels}
          renderItem={renderHotel}
          keyExtractor={(item) => String(item.hotel_id || item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  count: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#d1fae5',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardContent: {
    padding: 16,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4b5563',
  },
  bookButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default HotelRecommendationsListScreen;

