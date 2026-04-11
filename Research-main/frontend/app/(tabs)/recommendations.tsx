import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Hotel } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getHotelImageUrlSync, getPlaceholderImage } from '@/utils/imageUtils';

export default function RecommendationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuthStore();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const loadingRef = useRef(false);

  const loadHotels = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const location = params.location as string;
      const rating = params.rating as string;
      const amenitiesParam = params.amenities as string;

      // Parse minRating from rating string (e.g. "4+" -> 4)
      let minRating: number | undefined;
      if (rating && rating !== 'Any Rating') {
        minRating = parseFloat(rating.replace('+', ''));
      }

      // Parse amenities from comma-separated string (e.g. "beach,pool" -> ["beach", "pool"])
      let selectedAmenities: string[] | undefined;
      if (amenitiesParam && amenitiesParam.trim() !== '') {
        selectedAmenities = amenitiesParam.split(',').map((a) => a.trim()).filter(Boolean);
      }

      console.log('Loading recommendations with:', {
        location,
        minRating,
        amenities: selectedAmenities,
      });

      // Try to get recommendations - works even without token now
      const userId = user?.id || 'anonymous';
      const authToken = token || '';

      const data = await api.getRecommendations(
        userId,
        authToken,
        location || undefined,
        1000,
        selectedAmenities,
        minRating
      );
      setHotels(data);
      setError(null);
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      const errorMessage = error?.message || 'Failed to load recommendations';
      setError(errorMessage);

      // If token expired, try again without token
      if (errorMessage.includes('expired') || errorMessage.includes('Token expired')) {
        try {
          const location = params.location as string;
          const rating = params.rating as string;
          const amenitiesParam = params.amenities as string;

          let minRating: number | undefined;
          if (rating && rating !== 'Any Rating') {
            minRating = parseFloat(rating.replace('+', ''));
          }

          let selectedAmenities: string[] | undefined;
          if (amenitiesParam && amenitiesParam.trim() !== '') {
            selectedAmenities = amenitiesParam.split(',').map((a) => a.trim()).filter(Boolean);
          }

          const data = await api.getRecommendations(
            'anonymous',
            '',
            location || undefined,
            1000,
            selectedAmenities,
            minRating
          );
          setHotels(data);
          setError(null);
        } catch (retryError) {
          console.error('Error on retry:', retryError);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [params.location, params.rating, params.amenities, user?.id, token]);

  // Track previous params to prevent unnecessary reloads
  const prevParamsRef = useRef<string>('');

  useEffect(() => {
    const paramsKey = `${params.location || ''}-${params.rating || ''}-${params.amenities || ''}`;

    // Only reload if params actually changed
    if (prevParamsRef.current !== paramsKey) {
      prevParamsRef.current = paramsKey;
      loadHotels();
    }
  }, [params.location, params.rating, params.amenities, loadHotels]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHotels();
  };

  // Derived list: filter hotels by search query (name or location)
  const filteredHotels = searchQuery.trim()
    ? hotels.filter((h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : hotels;

  const HotelCard = React.memo(({ item }: { item: Hotel }) => {
    // Get image URL - use image_url from API if available, otherwise generate one
    const imageUrl = item.image_url || getHotelImageUrlSync(item.hotel_id, 1);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    return (
      <TouchableOpacity
        style={styles.hotelCard}
        onPress={() => router.push(`/hotel/${item.hotel_id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {imageError || !imageUrl ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="bed" size={40} color="#10b981" />
            </View>
          ) : (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={styles.hotelImage}
                resizeMode="cover"
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                defaultSource={{ uri: getPlaceholderImage() }}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#10b981" />
                </View>
              )}
            </>
          )}
          <View style={styles.priceTag}>
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
                  name={star <= Math.floor(item.rating) ? 'star' : 'star-outline'}
                  size={14}
                  color="#f59e0b"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>

          <View style={styles.amenitiesRow}>
            <View style={styles.amenityTag}>
              <Ionicons name="water" size={12} color="#10b981" />
              <Text style={styles.amenityText}>Pool</Text>
            </View>
            <View style={styles.amenityTag}>
              <Ionicons name="wifi" size={12} color="#10b981" />
              <Text style={styles.amenityText}>WiFi</Text>
            </View>
            <View style={styles.amenityTag}>
              <Ionicons name="restaurant" size={12} color="#10b981" />
              <Text style={styles.amenityText}>Restaurant</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() =>
              router.push({
                pathname: '/booking/details',
                params: { hotelId: item.hotel_id },
              })
            }
          >
            <Text style={styles.bookButtonText}>Book Now - $85/night</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  });

  const renderHotel = ({ item }: { item: Hotel }) => (
    <HotelCard item={item} />
  );

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
          <Text style={styles.backText}>Back to Search</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recommended Accommodations</Text>
        <Text style={styles.count}>{filteredHotels.length} properties found</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchBarInput}
          placeholder="Search by hotel name..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {filteredHotels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No hotels match your search' : 'No accommodations found'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? `Try a different name or clear the search`
              : error || 'Try adjusting your filters or check back later'}
          </Text>
          {!searchQuery && error && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadHotels}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredHotels}
          renderItem={renderHotel}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          numColumns={1}
        />
      )}
    </SafeAreaView>
  );
}

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
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  count: {
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
    backgroundColor: '#d1fae5',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
    marginBottom: 12,
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
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    paddingVertical: 0,
  },
});
