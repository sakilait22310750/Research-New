import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecommendationCard from '../components/RecommendationCard';
import apiService from '../services/apiService';
import hotelApiService from '../services/hotelApiService';

const RECENT_KEY = 'search_recent';
const MAX_RECENT = 5;

const POPULAR_KEYWORDS = ['beach', 'temple', 'fort', 'park', 'mountain'];

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [hotelResults, setHotelResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    loadInitialData();
    loadRecent();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else {
        setLocationResults([]);
        setHotelResults([]);
      }
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const loadRecent = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (_) { }
  };

  const saveRecent = async (list) => {
    try {
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (_) { }
  };

  const addToRecent = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
      saveRecent(updated);
      return updated;
    });
  };

  const removeRecent = (index) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      saveRecent(updated);
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    saveRecent([]);
  };

  const loadInitialData = async () => {
    try {
      const locations = await apiService.getLocationData();
      const trendingSearches = locations
        .sort((a, b) => b.overallSentiment - a.overallSentiment)
        .slice(0, 5)
        .map((loc) => loc.location);
      setTrending(trendingSearches);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const performSearch = useCallback(async (query) => {
    setLoading(true);
    try {
      const [locRes, htlRes] = await Promise.allSettled([
        apiService.searchLocations(query),
        hotelApiService.searchHotels(query, 10),
      ]);
      setLocationResults(
        locRes.status === 'fulfilled'
          ? locRes.value.map((l) => ({ type: 'location', data: l }))
          : []
      );
      setHotelResults(htlRes.status === 'fulfilled' ? htlRes.value : []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocationPress = (location) => {
    const locationName = location.location || location;
    navigation.navigate('LocationDetail', { location: locationName });
  };

  const handleKeywordTap = (keyword) => {
    addToRecent(keyword);
    setSearchQuery(keyword);
  };

  const handleSubmit = () => {
    if (searchQuery.trim().length >= 2) {
      addToRecent(searchQuery.trim());
    }
  };

  // ─── Render: Location result card (same as RecommendationsScreen) ────────────
  const renderLocationResult = ({ item }) => {
    const location = item.data || item;
    const normalized = {
      ...location,
      images: location.thumbnail ? [location.thumbnail] : (location.images || []),
    };
    return (
      <RecommendationCard
        location={normalized}
        onPress={() => handleLocationPress(location)}
        horizontal={false}
      />
    );
  };

  // ─── Render: Hotel result card ───────────────────────────────────────────────
  const renderHotelResult = ({ item }) => (
    <TouchableOpacity
      style={styles.hotelCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('HotelDetail', { hotelId: item.hotel_id })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.hotelImage} resizeMode="cover" />
      ) : (
        <View style={styles.hotelImagePlaceholder}>
          <Ionicons name="bed-outline" size={28} color="#9ca3af" />
        </View>
      )}
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.hotelLocationRow}>
          <Ionicons name="location-outline" size={12} color="#6b7280" />
          <Text style={styles.hotelLocation} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.hotelRatingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.floor(item.rating ?? 0) ? 'star' : 'star-outline'}
              size={11}
              color="#f59e0b"
            />
          ))}
          <Text style={styles.hotelRatingNum}>{(item.rating ?? 0).toFixed(1)}</Text>
          {item.total_reviews != null && (
            <Text style={styles.hotelReviews}>({item.total_reviews})</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#10b981" />
    </TouchableOpacity>
  );

  const hasResults = locationResults.length > 0 || hotelResults.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Navy Header ── */}
      <View style={styles.navyHeader}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hotels or locations..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* ── Hotel Results ── */}
        {hotelResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏨 Hotels</Text>
            <FlatList
              data={hotelResults}
              renderItem={renderHotelResult}
              keyExtractor={(item, index) => `hotel-${item.hotel_id || index}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* ── Location Results ── */}
        {locationResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Locations</Text>
            <FlatList
              data={locationResults}
              renderItem={renderLocationResult}
              keyExtractor={(item, index) => `loc-${index}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* ── No Results ── */}
        {searchQuery.length >= 2 && !loading && !hasResults && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={48} color="#9ca3af" />
            <Text style={styles.noResultsText}>Nothing found</Text>
            <Text style={styles.noResultsSubtext}>Try a hotel name, beach, or location</Text>
          </View>
        )}

        {/* ── Idle State ── */}
        {searchQuery.length < 2 && (
          <View style={styles.idleWrapper}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Recent search</Text>
                  <TouchableOpacity onPress={clearAllRecent}>
                    <Text style={styles.clearAll}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentRow}
                    onPress={() => handleKeywordTap(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time-outline" size={18} color="#9ca3af" />
                    <Text style={styles.recentText}>{item}</Text>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => removeRecent(index)}
                    >
                      <Ionicons name="close" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Search</Text>
              {POPULAR_KEYWORDS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularRow}
                  onPress={() => handleKeywordTap(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search-outline" size={18} color="#6b7280" />
                  <Text style={styles.popularText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Trending (from API data) */}
            {trending.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trending Searches</Text>
                {trending.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.popularRow}
                    onPress={() => handleKeywordTap(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trending-up" size={18} color="#059669" />
                    <Text style={[styles.popularText, { color: '#059669' }]}>{item}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  // ── Navy Header ──────────────────────────────────────────────────────────────
  navyHeader: {
    backgroundColor: '#0f2d55',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    padding: 0,
  },

  // ── Scroll body ──────────────────────────────────────────────────────────────
  scrollView: { flex: 1 },
  idleWrapper: { paddingBottom: 20 },
  section: { paddingHorizontal: 20, paddingTop: 22 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  clearAll: { fontSize: 14, color: '#059669', fontWeight: '600' },

  // ── Recent Searches ──────────────────────────────────────────────────────────
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  recentText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },

  // ── Popular Searches ─────────────────────────────────────────────────────────
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  popularText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },

  // ── Location Result Card — rendered by RecommendationCard component ──────────

  // ── Hotel Result Card ────────────────────────────────────────────────────────
  hotelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  hotelImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#e5e7eb' },
  hotelImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelInfo: { flex: 1, marginHorizontal: 12 },
  hotelName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 3 },
  hotelLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 5 },
  hotelLocation: { fontSize: 12, color: '#6b7280', flex: 1 },
  hotelRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hotelRatingNum: { fontSize: 12, fontWeight: '600', color: '#1f2937', marginLeft: 3 },
  hotelReviews: { fontSize: 11, color: '#9ca3af', marginLeft: 2 },

  // ── No Results ───────────────────────────────────────────────────────────────
  noResults: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  noResultsSubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
});

export default SearchScreen;
