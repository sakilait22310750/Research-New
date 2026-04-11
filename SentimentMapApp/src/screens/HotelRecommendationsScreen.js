import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hotelApiService from '../services/hotelApiService';

const LIKED_HOTELS_KEY = 'liked_hotels';

const getMatchPct = (score) =>
  score != null ? Math.min(99, Math.round(Math.abs(score) * 60 + 40)) : 82;

// ─── Landmark → Nearby City mapping ──────────────────────────────────────────
// Maps Sri Lankan landmark/attraction keywords to the nearest city that hotels
// are stored under in the database.
const LANDMARK_CITY_MAP = [
  // Kandy area
  { keywords: ['tooth relic', 'sacred tooth', 'kandy lake', 'peradeniya', 'botanical garden', 'udawatta'], city: 'Kandy' },
  // Galle area
  { keywords: ['galle fort', 'galle face', 'dutch fort', 'lighthouse galle'], city: 'Galle' },
  // Colombo area
  { keywords: ['colombo', 'beira lake', 'independence', 'pettah', 'fort colombo'], city: 'Colombo' },
  // Sigiriya / Dambulla
  { keywords: ['sigiriya', 'lion rock', 'dambulla', 'cave temple', 'rock fortress'], city: 'Sigiriya' },
  // Ella
  { keywords: ['nine arch', 'little adam', 'ella', 'ravana falls', 'mini world'], city: 'Ella' },
  // Nuwara Eliya
  { keywords: ['nuwara', 'horton plains', "world's end", 'gregory lake', 'victoria park'], city: 'Nuwara Eliya' },
  // Mirissa / South Coast
  { keywords: ['mirissa', 'whale watch'], city: 'Mirissa' },
  // Unawatuna
  { keywords: ['unawatuna', 'jungle beach'], city: 'Unawatuna' },
  // Hikkaduwa
  { keywords: ['hikkaduwa', 'coral reef'], city: 'Hikkaduwa' },
  // Bentota
  { keywords: ['bentota', 'brief garden', 'madu river'], city: 'Bentota' },
  // Negombo
  { keywords: ['negombo', 'muthurajawela'], city: 'Negombo' },
  // Trincomalee
  { keywords: ['trincomalee', 'nilaveli', 'pigeon island', 'koneswaram'], city: 'Trincomalee' },
  // Anuradhapura
  { keywords: ['anuradhapura', 'ruwanwelisaya', 'jaya sri maha', 'bodhi tree'], city: 'Anuradhapura' },
  // Polonnaruwa
  { keywords: ['polonnaruwa', 'gal vihara'], city: 'Polonnaruwa' },
  // Arugam Bay
  { keywords: ['arugam', 'pottuvil'], city: 'Arugam Bay' },
  // Yala / Hambantota
  { keywords: ['yala', 'national park yala'], city: 'Yala' },
  { keywords: ['hambantota', 'bundala', 'tissamaharama'], city: 'Hambantota' },
  // Pinnawala
  { keywords: ['pinnawala', 'elephant orphanage'], city: 'Pinnawala' },
  // Tangalle
  { keywords: ['tangalle', 'rekawa'], city: 'Tangalle' },
  // Weligama
  { keywords: ['weligama', 'stilt fishermen'], city: 'Weligama' },
  // Jaffna
  { keywords: ['jaffna', 'nainativu', 'nagadipa'], city: 'Jaffna' },
];

/**
 * Resolves a location name (which might be a landmark) to a searchable city
 * keyword. First checks the landmark map, then falls back to the first
 * meaningful word in the location string.
 */
function resolveNearbyCity(locationName) {
  if (!locationName) return '';
  const lower = locationName.toLowerCase();

  // 1. Check landmark → city mappings
  for (const { keywords, city } of LANDMARK_CITY_MAP) {
    if (keywords.some(k => lower.includes(k))) {
      return city;
    }
  }

  // 2. Split on commas/parens and return the first meaningful segment
  const first = locationName.split(/[,()]/)[0].trim();
  return first || locationName;
}

const HotelRecommendationsScreen = ({ route, navigation }) => {
  const { location, category, title } = route.params || {};
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedSet, setLikedSet] = useState(new Set());

  // Load liked hotels from AsyncStorage on mount
  useEffect(() => {
    const loadLiked = async () => {
      try {
        const raw = await AsyncStorage.getItem(LIKED_HOTELS_KEY);
        setLikedSet(raw ? new Set(JSON.parse(raw)) : new Set());
      } catch (e) {
        console.warn('[Recommendations] Failed to load liked set', e);
      }
    };
    loadLiked();
  }, []);

  useEffect(() => {
    const resolvedCity = resolveNearbyCity(location);
    const displayTitle = title
      || (category ? `${category.charAt(0).toUpperCase()}${category.slice(1)} Hotels`
        : location ? `Hotels near ${location}`
          : 'Recommended Accommodations');
    navigation.setOptions({ title: displayTitle });
    loadHotels(resolvedCity);
  }, [location, category]);

  const loadHotels = async (resolvedCity) => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (category) {
        // Category-specific list (beach / luxury / budget)
        data = await hotelApiService.getHotelsByCategory(category, 50);
      } else {
        // Location-based: use the resolved city name so landmarks like
        // "Temple of the Sacred Tooth Relic" correctly find Kandy hotels
        const searchCity = resolvedCity ?? resolveNearbyCity(location);
        data = await hotelApiService.getHotelRecommendations({
          location: searchCity || '',
          limit: 40,
          minRating: 3.0,
          amenities: [],
        });
      }

      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };


  // Toggle like from the list card
  const handleToggleLike = useCallback(async (hotelId) => {
    const id = Number(hotelId);
    const isLiked = likedSet.has(id) || likedSet.has(String(hotelId));
    const newLiked = !isLiked;
    // Optimistic UI update
    setLikedSet(prev => {
      const next = new Set(prev);
      if (newLiked) { next.add(id); }
      else { next.delete(id); next.delete(String(hotelId)); }
      return next;
    });
    try {
      const raw = await AsyncStorage.getItem(LIKED_HOTELS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(arr);
      if (newLiked) { set.add(id); } else { set.delete(id); set.delete(String(hotelId)); }
      await AsyncStorage.setItem(LIKED_HOTELS_KEY, JSON.stringify([...set]));
      await hotelApiService.submitFavourite(id, newLiked ? 5.0 : 1.0);
    } catch (e) {
      console.warn('[Recommendations] submitFavourite error', e);
    }
  }, [likedSet]);

  const renderHotel = ({ item }) => {
    const rating = item.rating ?? 0;
    const sentiment = item.avg_sentiment_score ?? 0;
    const match = getMatchPct(sentiment);
    const price = item.price_info?.min ?? null;
    const isLiked = likedSet.has(Number(item.hotel_id)) || likedSet.has(String(item.hotel_id));

    const handleBookNow = async () => {
      const url = `https://www.booking.com/search.html?ss=${encodeURIComponent(
        item.name + ' ' + item.location
      )}`;
      try { await Linking.openURL(url); } catch (e) { console.error(e); }
    };

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('HotelDetail', { hotelId: item.hotel_id })}
      >
        {/* Image */}
        <View style={styles.imgContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={[styles.img, styles.imgPlaceholder]}>
              <Ionicons name="bed-outline" size={32} color="#94a3b8" />
            </View>
          )}

          {/* Match badge top-left */}
          <View style={styles.matchBadge}>
            <Ionicons name="flash" size={11} color="#fff" />
            <Text style={styles.matchText}>{match}% Match</Text>
          </View>

          {/* Heart top-right */}
          <TouchableOpacity style={styles.heartBtn} onPress={() => handleToggleLike(item.hotel_id)}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={17} color="#ef4444" />
          </TouchableOpacity>

          {/* Price badge bottom-right */}
          {price != null && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>${price}/USD</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={13} color="#64748b" />
            <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
          </View>

          {/* Rating + sentiment row */}
          <View style={styles.metaRow}>
            <View style={styles.ratingCol}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons key={s} name={s <= Math.floor(rating) ? 'star' : 'star-outline'} size={12} color="#f59e0b" />
              ))}
              <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
            </View>
            <View style={styles.sentimentPill}>
              <Ionicons name="happy-outline" size={13} color="#22c55e" />
              <Text style={styles.sentimentText}>Sentiment: {(sentiment * 100).toFixed(0)}%</Text>
            </View>
          </View>

          {/* Book Now button */}
          <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow}>
            <Text style={styles.bookBtnText}>
              Book Now{price != null ? ` – $${price}/night` : ''}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.helperText}>Finding best hotels{location ? ` in ${location}` : ''}...</Text>
      </View>
    );

    if (error) return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadHotels}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );

    if (!hotels.length) return (
      <View style={styles.centered}>
        <Ionicons name="bed-outline" size={48} color="#94a3b8" />
        <Text style={styles.helperText}>No hotels found for this destination.</Text>
      </View>
    );

    return (
      <FlatList
        data={hotels}
        keyExtractor={(item, i) => `${item.hotel_id ?? i}`}
        renderItem={renderHotel}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>
            {title
              || (category ? `${category.charAt(0).toUpperCase()}${category.slice(1)} Hotels`
                : location ? `Hotels near ${location}`
                  : 'Recommended Accommodations')}
          </Text>
          <Text style={styles.headerSub}>
            {hotels.length > 0 ? `${hotels.length} properties found` : 'Based on real guest reviews & AI analysis'}
          </Text>
        </View>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: '#0c2340',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  backBtn: { padding: 2 },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#94a3b8' },

  list: { padding: 16, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  helperText: { marginTop: 12, fontSize: 14, color: '#64748b', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 16, marginTop: 8 },
  retryBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 20,
    overflow: 'hidden',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  imgContainer: { height: 200, position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },

  matchBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#f59e0b', flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  matchText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heartBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#fff', width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  priceBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  priceBadgeText: { fontSize: 12, fontWeight: '700', color: '#0c2340' },

  cardBody: { padding: 14 },
  hotelName: { fontSize: 17, fontWeight: '800', color: '#0c2340', marginBottom: 5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locText: { fontSize: 13, color: '#64748b', flex: 1 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ratingCol: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingNum: { fontSize: 13, fontWeight: '700', color: '#0c2340', marginLeft: 4 },
  sentimentPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  sentimentText: { fontSize: 11, color: '#15803d', fontWeight: '600' },

  bookBtn: {
    backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

export default HotelRecommendationsScreen;
