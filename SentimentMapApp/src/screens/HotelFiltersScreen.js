// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   TextInput,
//   ActivityIndicator,
//   Dimensions,
//   Linking,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import hotelApiService from '../services/hotelApiService';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const CARD_WIDTH = SCREEN_WIDTH * 0.62;

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// // Returns the real positive-review % from the NLP backend.
// // Falls back to sentiment conversion for older API responses without the field.
// const getPositivePct = (hotel) => {
//   if (hotel.positive_pct != null) return hotel.positive_pct;
//   const score = hotel.avg_sentiment_score;
//   return score != null ? Math.min(99, Math.round(Math.abs(score) * 60 + 40)) : 0;
// };

// // Client-side keyword helpers removed — beach/luxury/budget now served
// // by the CNN-powered /api/hotel-category endpoint on the backend.


// // ─── Hotel Card ───────────────────────────────────────────────────────────────

// const HotelCard = ({ hotel, onPress }) => {
//   const match = getPositivePct(hotel);
//   const price = hotel.price_info?.min ?? null;
//   const rating = hotel.rating ?? 0;

//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
//       <View style={styles.cardImageContainer}>
//         {hotel.image_url ? (
//           <Image
//             source={{ uri: hotel.image_url }}
//             style={styles.cardImage}
//             resizeMode="cover"
//           />
//         ) : (
//           <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
//             <Ionicons name="bed-outline" size={36} color="#94a3b8" />
//           </View>
//         )}

//         {/* Match badge */}
//         <View style={styles.matchBadge}>
//           <Ionicons name="flash" size={11} color="#fff" />
//           <Text style={styles.matchText}>{match}% Positive</Text>
//         </View>

//         {/* Heart */}
//         <TouchableOpacity style={styles.heartBtn}>
//           <Ionicons name="heart-outline" size={18} color="#ef4444" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.cardBody}>
//         <Text style={styles.cardName} numberOfLines={1}>{hotel.name}</Text>
//         <View style={styles.cardLocRow}>
//           <Ionicons name="location-outline" size={12} color="#64748b" />
//           <Text style={styles.cardLoc} numberOfLines={1}>{hotel.location}</Text>
//         </View>
//         <View style={styles.cardBottom}>
//           <View style={styles.cardRatingRow}>
//             <Ionicons name="star" size={12} color="#f59e0b" />
//             <Text style={styles.cardRating}>{rating.toFixed(1)}</Text>
//             <Text style={styles.cardReviews}>({hotel.total_reviews ?? 0})</Text>
//           </View>
//           {price != null && (
//             <Text style={styles.cardPrice}>
//               <Text style={styles.cardPriceDollar}>${price}</Text>
//               <Text style={styles.cardPriceUnit}>/night</Text>
//             </Text>
//           )}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// // ─── Section ──────────────────────────────────────────────────────────────────

// const SectionHeader = ({ title, subtitle, onSeeAll }) => (
//   <View style={styles.sectionHeader}>
//     <View>
//       <Text style={styles.sectionTitle}>{title}</Text>
//       {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
//     </View>
//     <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
//       <Text style={styles.seeAllText}>See All</Text>
//       <Ionicons name="chevron-forward" size={14} color="#f59e0b" />
//     </TouchableOpacity>
//   </View>
// );

// const HorizontalSection = ({ title, subtitle, hotels, onHotelPress, onSeeAll, loading }) => (
//   <View style={styles.section}>
//     <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
//     {loading ? (
//       <View style={styles.sectionLoading}>
//         <ActivityIndicator color="#f59e0b" />
//       </View>
//     ) : hotels.length === 0 ? (
//       <View style={styles.sectionLoading}>
//         <Text style={styles.emptyText}>No hotels found</Text>
//       </View>
//     ) : (
//       <FlatList
//         data={hotels}
//         keyExtractor={(item, i) => `${item.hotel_id ?? i}`}
//         renderItem={({ item }) => (
//           <HotelCard hotel={item} onPress={() => onHotelPress(item)} />
//         )}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.hList}
//         snapToInterval={CARD_WIDTH + 12}
//         decelerationRate="fast"
//       />
//     )}
//   </View>
// );

// // ─── Main Screen ──────────────────────────────────────────────────────────────

// const HotelFiltersScreen = ({ navigation }) => {
//   const [recommended, setRecommended] = useState([]);
//   const [beachHotels, setBeachHotels] = useState([]);
//   const [luxuryHotels, setLuxuryHotels] = useState([]);
//   const [budgetHotels, setBudgetHotels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [dbStats, setDbStats] = useState({ total: null, avg_rating: null });
//   const searchDebounce = useRef(null);

//   // All hotels combined (for budget fallback only)
//   const hotels = [...recommended, ...beachHotels, ...luxuryHotels, ...budgetHotels];

//   const loadHotels = useCallback(async () => {
//     try {
//       setLoading(true);
//       const [recoData, beachData, luxuryData, budgetData, statsData] = await Promise.all([
//         hotelApiService.getHotelRecommendations({ location: '', limit: 12, minRating: 3.5, amenities: [] }),
//         hotelApiService.getHotelsByCategory('beach', 12),
//         hotelApiService.getHotelsByCategory('luxury', 12),
//         hotelApiService.getHotelsByCategory('budget', 12),
//         hotelApiService.getHotelStats(),
//       ]);
//       setRecommended(Array.isArray(recoData) ? recoData.slice(0, 12) : []);
//       setBeachHotels(Array.isArray(beachData) ? beachData : []);
//       setLuxuryHotels(Array.isArray(luxuryData) ? luxuryData : []);
//       setBudgetHotels(Array.isArray(budgetData) ? budgetData : []);
//       if (statsData && statsData.total != null) setDbStats(statsData);
//     } catch (e) {
//       console.error('[Hotels] Failed to load hotels:', e.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { loadHotels(); }, []);

//   // ── Live search suggestions ──────────────────────────────────────────────
//   const handleSearchChange = (text) => {
//     setSearchQuery(text);
//     if (searchDebounce.current) clearTimeout(searchDebounce.current);
//     if (text.trim().length < 2) {
//       setSuggestions([]);
//       setShowSuggestions(false);
//       return;
//     }
//     searchDebounce.current = setTimeout(async () => {
//       try {
//         const results = await hotelApiService.searchHotelsLive(text.trim(), 8);
//         setSuggestions(Array.isArray(results) ? results : []);
//         setShowSuggestions(true);
//       } catch (_) {
//         setSuggestions([]);
//       }
//     }, 300);
//   };

//   const handleSelectSuggestion = (hotel) => {
//     setSearchQuery(hotel.name);
//     setSuggestions([]);
//     setShowSuggestions(false);
//     navigation.navigate('HotelDetail', { hotelId: hotel.hotel_id });
//   };

//   const handleSearchSubmit = () => {
//     setSuggestions([]);
//     setShowSuggestions(false);
//     if (searchQuery.trim()) {
//       navigation.navigate('HotelRecommendations', { location: searchQuery.trim() });
//     }
//   };

//   const handleHotelPress = (hotel) =>
//     navigation.navigate('HotelDetail', { hotelId: hotel.hotel_id });


//   const stats = [
//     {
//       value: dbStats.total != null ? `${dbStats.total}+` : (loading ? '—' : `${hotels.length}+`),
//       label: 'Properties',
//     },
//     {
//       value: dbStats.avg_rating != null
//         ? `${dbStats.avg_rating.toFixed(1)}★`
//         : (loading ? '—' : '4.6★'),
//       label: 'Avg Rating',
//     },
//   ];


//   return (
//     <SafeAreaView style={styles.safeArea} edges={['top']}>
//       <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

//         {/* ── Header ── */}
//         <View style={styles.header}>
//           <View style={styles.headerTopRow}>
//             <View>
//               <Text style={styles.headerLabel}>Explore Hotels</Text>
//               <Text style={styles.headerTitle}>Find Your Perfect Stay</Text>
//             </View>
//             <TouchableOpacity style={styles.iconCircle} onPress={loadHotels}>
//               <Ionicons name="refresh-outline" size={20} color="#fff" />
//             </TouchableOpacity>
//           </View>

//           {/* Search bar + suggestions */}
//           <View style={styles.searchWrapper}>
//             <View style={styles.searchRow}>
//               <View style={styles.searchBox}>
//                 <Ionicons name="search-outline" size={18} color="#94a3b8" />
//                 <TextInput
//                   style={styles.searchInput}
//                   placeholder="Search hotels, destinations..."
//                   placeholderTextColor="#94a3b8"
//                   value={searchQuery}
//                   onChangeText={handleSearchChange}
//                   onSubmitEditing={handleSearchSubmit}
//                   returnKeyType="search"
//                 />
//                 {searchQuery.length > 0 && (
//                   <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
//                     <Ionicons name="close-circle" size={16} color="#94a3b8" />
//                   </TouchableOpacity>
//                 )}
//               </View>
//               <TouchableOpacity style={styles.filterBtn} onPress={handleSearchSubmit}>
//                 <Ionicons name="search" size={20} color="#fff" />
//               </TouchableOpacity>
//             </View>

//             {/* Suggestions dropdown */}
//             {showSuggestions && suggestions.length > 0 && (
//               <View style={styles.suggestionsBox}>
//                 {suggestions.map((s, i) => (
//                   <TouchableOpacity
//                     key={s.hotel_id}
//                     style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionBorder]}
//                     onPress={() => handleSelectSuggestion(s)}
//                     activeOpacity={0.7}
//                   >
//                     <Ionicons name="business-outline" size={14} color="#64748b" style={{ marginRight: 8 }} />
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
//                       <Text style={styles.suggestionLoc} numberOfLines={1}>{s.location}</Text>
//                     </View>
//                     <View style={styles.suggestionRating}>
//                       <Ionicons name="star" size={11} color="#f59e0b" />
//                       <Text style={styles.suggestionRatingText}>{(s.rating ?? 0).toFixed(1)}</Text>
//                     </View>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}
//           </View>

//           {/* Location pill */}
//           <View style={styles.locationPill}>
//             <Ionicons name="location-outline" size={14} color="#94a3b8" />
//             <Text style={styles.locationPillText}>Sri Lanka · All Provinces</Text>
//           </View>
//         </View>

//         {/* ── Stats ── */}
//         <View style={styles.statsRow}>
//           {stats.map((s, i) => (
//             <View key={i} style={[styles.statCard, i === 1 && styles.statCardMiddle]}>
//               <Text style={styles.statValue}>{s.value}</Text>
//               <Text style={styles.statLabel}>{s.label}</Text>
//             </View>
//           ))}
//         </View>

//         {/* ── Sections ── */}
//         <HorizontalSection
//           title="Recommended For You"
//           subtitle="Based on your preferences"
//           hotels={recommended}
//           loading={loading}
//           onHotelPress={handleHotelPress}
//           onSeeAll={() => navigation.navigate('HotelRecommendations', { location: '' })}
//         />

//         <HorizontalSection
//           title="Top Beach Hotels"
//           subtitle="Crystal clear waters await"
//           hotels={beachHotels}
//           loading={loading}
//           onHotelPress={handleHotelPress}
//           onSeeAll={() => navigation.navigate('HotelRecommendations', { location: 'Galle' })}
//         />

//         <HorizontalSection
//           title="Luxury Stays"
//           subtitle="Indulge in world-class comfort"
//           hotels={luxuryHotels}
//           loading={loading}
//           onHotelPress={handleHotelPress}
//           onSeeAll={() => navigation.navigate('HotelRecommendations', { location: 'Kandy' })}
//         />

//         <HorizontalSection
//           title="Budget Friendly"
//           subtitle="Great stays, great value"
//           hotels={budgetHotels.length > 0 ? budgetHotels : hotels.slice(-10)}
//           loading={loading}
//           onHotelPress={handleHotelPress}
//           onSeeAll={() => navigation.navigate('HotelRecommendations', { location: '' })}
//         />

//         <View style={{ height: 24 }} />
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: '#0c2340' },
//   scroll: { flex: 1, backgroundColor: '#f1f5f9' },

//   // Header
//   header: {
//     backgroundColor: '#0c2340',
//     paddingHorizontal: 20,
//     paddingTop: 8,
//     paddingBottom: 24,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   headerTopRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 20,
//   },
//   headerLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '400' },
//   headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
//   iconCircle: {
//     width: 40, height: 40, borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     justifyContent: 'center', alignItems: 'center',
//   },

//   // Search
//   searchWrapper: { position: 'relative', marginBottom: 14 },
//   searchRow: { flexDirection: 'row', gap: 10 },
//   searchBox: {
//     flex: 1, flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#fff', borderRadius: 14,
//     paddingHorizontal: 14, paddingVertical: 10, gap: 8,
//   },
//   suggestionsBox: {
//     position: 'absolute', top: 52, left: 0, right: 52,
//     backgroundColor: '#fff', borderRadius: 14,
//     elevation: 8, shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
//     zIndex: 999,
//     overflow: 'hidden',
//   },
//   suggestionItem: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: 14, paddingVertical: 11,
//   },
//   suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
//   suggestionName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
//   suggestionLoc: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
//   suggestionRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
//   suggestionRatingText: { fontSize: 11, fontWeight: '600', color: '#f59e0b' },
//   searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
//   filterBtn: {
//     width: 46, height: 46, borderRadius: 14,
//     backgroundColor: '#f59e0b',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   locationPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   locationPillText: { fontSize: 13, color: '#94a3b8' },

//   // Stats
//   statsRow: {
//     flexDirection: 'row',
//     marginHorizontal: 20,
//     marginTop: -20,
//     marginBottom: 24,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//   },
//   statCard: {
//     flex: 1, paddingVertical: 18, alignItems: 'center',
//   },
//   statCardMiddle: {
//     borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9',
//   },
//   statValue: { fontSize: 18, fontWeight: '800', color: '#0c2340' },
//   statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

//   // Section
//   section: { marginBottom: 8 },
//   sectionHeader: {
//     flexDirection: 'row', justifyContent: 'space-between',
//     alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 14,
//   },
//   sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0c2340' },
//   sectionSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
//   seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
//   seeAllText: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
//   hList: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
//   sectionLoading: {
//     height: 220, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
//   },
//   emptyText: { color: '#94a3b8', fontSize: 14 },

//   // Hotel card
//   card: {
//     width: CARD_WIDTH,
//     backgroundColor: '#fff',
//     borderRadius: 18,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//   },
//   cardImageContainer: { height: 170, position: 'relative' },
//   cardImage: { width: '100%', height: '100%' },
//   cardImagePlaceholder: {
//     backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center',
//   },
//   matchBadge: {
//     position: 'absolute', top: 10, left: 10,
//     backgroundColor: '#f59e0b',
//     flexDirection: 'row', alignItems: 'center', gap: 3,
//     paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
//   },
//   matchText: { color: '#fff', fontSize: 11, fontWeight: '700' },
//   heartBtn: {
//     position: 'absolute', top: 10, right: 10,
//     backgroundColor: '#fff',
//     width: 32, height: 32, borderRadius: 16,
//     justifyContent: 'center', alignItems: 'center',
//     elevation: 2,
//   },
//   cardBody: { padding: 12 },
//   cardName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
//   cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
//   cardLoc: { fontSize: 12, color: '#64748b', flex: 1 },
//   cardBottom: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//   },
//   cardRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
//   cardRating: { fontSize: 13, fontWeight: '700', color: '#0c2340' },
//   cardReviews: { fontSize: 11, color: '#94a3b8' },
//   cardPrice: {},
//   cardPriceDollar: { fontSize: 15, fontWeight: '800', color: '#f59e0b' },
//   cardPriceUnit: { fontSize: 11, color: '#94a3b8' },
// });

// export default HotelFiltersScreen;



import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hotelApiService from '../services/hotelApiService';

const LIKED_HOTELS_KEY = 'liked_hotels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.62;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns the real positive-review % from the NLP backend.
// Falls back to sentiment conversion for older API responses without the field.
const getPositivePct = (hotel) => {
  if (hotel.positive_pct != null) return hotel.positive_pct;
  const score = hotel.avg_sentiment_score;
  return score != null ? Math.min(99, Math.round(Math.abs(score) * 60 + 40)) : 0;
};

// Client-side keyword helpers removed — beach/luxury/budget now served
// by the CNN-powered /api/hotel-category endpoint on the backend.


// ─── Hotel Card ───────────────────────────────────────────────────────────────

const HotelCard = ({ hotel, onPress, isLiked, onToggleLike }) => {
  const match = getPositivePct(hotel);
  const price = hotel.price_info?.min ?? null;
  const rating = hotel.rating ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardImageContainer}>
        {hotel.image_url ? (
          <Image
            source={{ uri: hotel.image_url }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="bed-outline" size={36} color="#94a3b8" />
          </View>
        )}

        {/* Match badge */}
        <View style={styles.matchBadge}>
          <Ionicons name="flash" size={11} color="#fff" />
          <Text style={styles.matchText}>{match}% Positive</Text>
        </View>

        {/* Heart */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={(e) => { e.stopPropagation?.(); onToggleLike?.(hotel.hotel_id); }}
        >
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{hotel.name}</Text>
        <View style={styles.cardLocRow}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={styles.cardLoc} numberOfLines={1}>{hotel.location}</Text>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.cardRatingRow}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.cardRating}>{rating.toFixed(1)}</Text>
            <Text style={styles.cardReviews}>({hotel.total_reviews ?? 0})</Text>
          </View>
          {price != null && (
            <Text style={styles.cardPrice}>
              <Text style={styles.cardPriceDollar}>${price}</Text>
              <Text style={styles.cardPriceUnit}>/night</Text>
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, onSeeAll }) => (
  <View style={styles.sectionHeader}>
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
    <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
      <Text style={styles.seeAllText}>See All</Text>
      <Ionicons name="chevron-forward" size={14} color="#f59e0b" />
    </TouchableOpacity>
  </View>
);

const HorizontalSection = ({ title, subtitle, hotels, onHotelPress, onSeeAll, loading, likedSet, onToggleLike }) => (
  <View style={styles.section}>
    <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
    {loading ? (
      <View style={styles.sectionLoading}>
        <ActivityIndicator color="#f59e0b" />
      </View>
    ) : hotels.length === 0 ? (
      <View style={styles.sectionLoading}>
        <Text style={styles.emptyText}>No hotels found</Text>
      </View>
    ) : (
      <FlatList
        data={hotels}
        keyExtractor={(item, i) => `${item.hotel_id ?? i}`}
        renderItem={({ item }) => (
          <HotelCard
            hotel={item}
            onPress={() => onHotelPress(item)}
            isLiked={likedSet?.has(Number(item.hotel_id)) || likedSet?.has(String(item.hotel_id))}
            onToggleLike={onToggleLike}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      />
    )}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const HotelFiltersScreen = ({ navigation }) => {
  const [recommended, setRecommended] = useState([]);
  const [beachHotels, setBeachHotels] = useState([]);
  const [luxuryHotels, setLuxuryHotels] = useState([]);
  const [budgetHotels, setBudgetHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dbStats, setDbStats] = useState({ total: null, avg_rating: null });
  const [likedSet, setLikedSet] = useState(new Set());
  const searchDebounce = useRef(null);

  // Load liked hotels from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(LIKED_HOTELS_KEY).then(raw => {
      setLikedSet(raw ? new Set(JSON.parse(raw)) : new Set());
    }).catch(() => { });
  }, []);

  // Toggle like from home screen card
  const handleToggleLike = useCallback(async (hotelId) => {
    const id = Number(hotelId);
    const isLiked = likedSet.has(id) || likedSet.has(String(hotelId));
    const newLiked = !isLiked;
    setLikedSet(prev => {
      const next = new Set(prev);
      if (newLiked) { next.add(id); } else { next.delete(id); next.delete(String(hotelId)); }
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
      console.warn('[HomeScreen] submitFavourite error', e);
    }
  }, [likedSet]);

  // All hotels combined (for budget fallback only)
  const hotels = [...recommended, ...beachHotels, ...luxuryHotels, ...budgetHotels];

  const loadHotels = useCallback(async () => {
    try {
      setLoading(true);
      const [recoData, beachData, luxuryData, budgetData, statsData] = await Promise.all([
        hotelApiService.getHotelRecommendations({ location: '', limit: 12, minRating: 3.5, amenities: [] }),
        hotelApiService.getHotelsByCategory('beach', 12),
        hotelApiService.getHotelsByCategory('luxury', 12),
        hotelApiService.getHotelsByCategory('budget', 12),
        hotelApiService.getHotelStats(),
      ]);

      const luxury = Array.isArray(luxuryData) ? luxuryData : [];
      const budget = Array.isArray(budgetData) ? budgetData : [];

      // Deduplicate: a hotel appearing in both lists stays only in luxury
      const luxuryIds = new Set(luxury.map(h => h.hotel_id));
      const uniqueBudget = budget.filter(h => !luxuryIds.has(h.hotel_id));

      setRecommended(Array.isArray(recoData) ? recoData.slice(0, 12) : []);
      setBeachHotels(Array.isArray(beachData) ? beachData : []);
      setLuxuryHotels(luxury);
      setBudgetHotels(uniqueBudget);
      if (statsData && statsData.total != null) setDbStats(statsData);
    } catch (e) {
      console.error('[Hotels] Failed to load hotels:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHotels(); }, []);

  // ── Live search suggestions ──────────────────────────────────────────────
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await hotelApiService.searchHotelsLive(text.trim(), 8);
        setSuggestions(Array.isArray(results) ? results : []);
        setShowSuggestions(true);
      } catch (_) {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelectSuggestion = (hotel) => {
    setSearchQuery(hotel.name);
    setSuggestions([]);
    setShowSuggestions(false);
    navigation.navigate('HotelDetail', { hotelId: hotel.hotel_id });
  };

  const handleSearchSubmit = () => {
    setSuggestions([]);
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigation.navigate('HotelRecommendations', { location: searchQuery.trim() });
    }
  };

  const handleHotelPress = (hotel) =>
    navigation.navigate('HotelDetail', { hotelId: hotel.hotel_id });


  const stats = [
    {
      value: dbStats.total != null ? `${dbStats.total}+` : (loading ? '—' : `${hotels.length}+`),
      label: 'Properties',
    },
    {
      value: dbStats.avg_rating != null
        ? `${dbStats.avg_rating.toFixed(1)}★`
        : (loading ? '—' : '4.6★'),
      label: 'Avg Rating',
    },
  ];


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerLabel}>Explore Hotels</Text>
              <Text style={styles.headerTitle}>Find Your Perfect Stay</Text>
            </View>
            <TouchableOpacity style={styles.iconCircle} onPress={loadHotels}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search bar + suggestions */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search hotels, destinations..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.filterBtn} onPress={handleSearchSubmit}>
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={s.hotel_id}
                    style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionBorder]}
                    onPress={() => handleSelectSuggestion(s)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="business-outline" size={14} color="#64748b" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.suggestionLoc} numberOfLines={1}>{s.location}</Text>
                    </View>
                    <View style={styles.suggestionRating}>
                      <Ionicons name="star" size={11} color="#f59e0b" />
                      <Text style={styles.suggestionRatingText}>{(s.rating ?? 0).toFixed(1)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Location pill */}
          <View style={styles.locationPill}>
            <Ionicons name="location-outline" size={14} color="#94a3b8" />
            <Text style={styles.locationPillText}>Sri Lanka · All Provinces</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, i === 1 && styles.statCardMiddle]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Sections ── */}
        <HorizontalSection
          title="Recommended For You"
          subtitle="Based on your preferences"
          hotels={recommended}
          loading={loading}
          onHotelPress={handleHotelPress}
          onSeeAll={() => navigation.navigate('HotelRecommendations', { location: '' })}
          likedSet={likedSet}
          onToggleLike={handleToggleLike}
        />

        <HorizontalSection
          title="Top Beach Hotels"
          subtitle="Crystal clear waters await"
          hotels={beachHotels}
          loading={loading}
          onHotelPress={handleHotelPress}
          onSeeAll={() => navigation.navigate('HotelRecommendations', { category: 'beach', title: 'Top Beach Hotels' })}
          likedSet={likedSet}
          onToggleLike={handleToggleLike}
        />

        <HorizontalSection
          title="Luxury Stays"
          subtitle="Indulge in world-class comfort"
          hotels={luxuryHotels}
          loading={loading}
          onHotelPress={handleHotelPress}
          onSeeAll={() => navigation.navigate('HotelRecommendations', { category: 'luxury', title: 'Luxury Stays' })}
          likedSet={likedSet}
          onToggleLike={handleToggleLike}
        />

        <HorizontalSection
          title="Budget Friendly"
          subtitle="Great stays, great value"
          hotels={budgetHotels.length > 0 ? budgetHotels : hotels.slice(-10)}
          loading={loading}
          onHotelPress={handleHotelPress}
          onSeeAll={() => navigation.navigate('HotelRecommendations', { category: 'budget', title: 'Budget Friendly' })}
          likedSet={likedSet}
          onToggleLike={handleToggleLike}
        />

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0c2340' },
  scroll: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: '#0c2340',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '400' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Search
  searchWrapper: { position: 'relative', marginBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  suggestionsBox: {
    position: 'absolute', top: 52, left: 0, right: 52,
    backgroundColor: '#fff', borderRadius: 14,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
    zIndex: 999,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  suggestionLoc: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  suggestionRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  suggestionRatingText: { fontSize: 11, fontWeight: '600', color: '#f59e0b' },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  filterBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
  },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationPillText: { fontSize: 13, color: '#94a3b8' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statCard: {
    flex: 1, paddingVertical: 18, alignItems: 'center',
  },
  statCardMiddle: {
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0c2340' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Section
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0c2340' },
  sectionSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
  hList: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  sectionLoading: {
    height: 220, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  emptyText: { color: '#94a3b8', fontSize: 14 },

  // Hotel card
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardImageContainer: { height: 170, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: {
    backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: '#f59e0b',
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  matchText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#fff',
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2,
  },
  cardBody: { padding: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  cardLoc: { fontSize: 12, color: '#64748b', flex: 1 },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardRating: { fontSize: 13, fontWeight: '700', color: '#0c2340' },
  cardReviews: { fontSize: 11, color: '#94a3b8' },
  cardPrice: {},
  cardPriceDollar: { fontSize: 15, fontWeight: '800', color: '#f59e0b' },
  cardPriceUnit: { fontSize: 11, color: '#94a3b8' },
});

export default HotelFiltersScreen;

