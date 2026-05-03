// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Image,
//   Dimensions,
//   Linking,
//   Modal,
//   Animated,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import hotelApiService from '../services/hotelApiService';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// // ─── Amenity icon mapping ─────────────────────────────────────────────────────
// const AMENITY_ICON = {
//   'Swimming Pool': { icon: '🌊', name: 'Pool' },
//   'Beach Access': { icon: '🏖️', name: 'Beach Access' },
//   'Spa & Wellness': { icon: '✨', name: 'Spa' },
//   'Fitness Centre': { icon: '🥊', name: 'Gym' },
//   'Restaurant': { icon: '🍴', name: 'Restaurant' },
//   'Bar / Lounge': { icon: '🍺', name: 'Bar' },
//   'Free WiFi': { icon: '📶', name: 'WiFi' },
//   'Parking': { icon: '🚗', name: 'Parking' },
//   'Airport Transfer': { icon: '✈️', name: 'Transfer' },
//   'Nature / Wildlife': { icon: '🌿', name: 'Nature' },
//   'Lakeside / Riverside': { icon: '⛵', name: 'Lakeside' },
//   'Rooftop': { icon: '🏢', name: 'Rooftop' },
//   'Business Facilities': { icon: '💼', name: 'Business' },
//   'Family Friendly': { icon: '👨‍👩‍👧', name: 'Family' },
//   'Pet Friendly': { icon: '🐾', name: 'Pet Friendly' },
//   'Scenic Views': { icon: '🔭', name: 'Scenic' },
//   'Tea Plantation': { icon: '☕', name: 'Tea' },
//   'Surfing': { icon: '🏄', name: 'Surfing' },
//   'Water Sports': { icon: '🐠', name: 'Water Sports' },
//   'Air Conditioning': { icon: '❄️', name: 'A/C' },
//   'Room Service': { icon: '🛎️', name: 'Room Service' },
// };

// // ─── Tags shown under hotel name ──────────────────────────────────────────────
// const LOCATION_TAGS = (location = '') => {
//   const loc = location.toLowerCase();
//   const tags = [];
//   if (['beach', 'coast', 'galle', 'bentota', 'hikkaduwa', 'negombo', 'trincomalee',
//     'mirissa', 'unawatuna', 'ahungalla', 'tangalle'].some(k => loc.includes(k))) tags.push('Beachfront');
//   if (loc.includes('kandy') || loc.includes('nuwara') || loc.includes('sigiriya')) tags.push('Cultural');
//   return tags;
// };

// const getRatingTags = (name = '', rating = 0) => {
//   const tags = [];
//   const n = name.toLowerCase();
//   if (['jetwing', 'cinnamon', 'heritance', 'shangri', 'hilton', 'marriott', 'anantara', 'uga'].some(k => n.includes(k)) || rating >= 4.5)
//     tags.push('Luxury');
//   if (n.includes('spa') || n.includes('retreat') || n.includes('wellness')) tags.push('Spa');
//   return tags;
// };



// // ─── Main Screen ──────────────────────────────────────────────────────────────

// const TABS = ['Overview', 'Amenities', 'Reviews'];

// const HotelDetailScreen = ({ route, navigation }) => {
//   const { hotelId, nightlyRate } = route.params || {};
//   const [hotel, setHotel] = useState(null);
//   const [images, setImages] = useState([]);
//   const [currentIdx, setCurrentIdx] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [imagesLoading, setImagesLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('Overview');
//   const [showBookingModal, setShowBookingModal] = useState(false);
//   const [liked, setLiked] = useState(false);

//   // Load hotel details
//   useEffect(() => {
//     const load = async () => {
//       if (!hotelId) { setError('Hotel ID missing'); setLoading(false); return; }
//       try {
//         const details = await hotelApiService.getHotelDetails(hotelId);
//         setHotel(details);
//         navigation.setOptions({ title: details.name || 'Hotel Details' });
//       } catch (err) {
//         setError(err.message || 'Failed to load hotel details');
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [hotelId]);

//   // Load images
//   useEffect(() => {
//     if (!hotel) return;
//     const loadImgs = async () => {
//       try {
//         const list = await hotelApiService.getHotelImages(hotelId);
//         const urls = list?.map((img) => img.url || img) || [];
//         setImages(urls.length > 0 ? urls : hotel.image_url ? [hotel.image_url] : []);
//       } catch {
//         setImages(hotel.image_url ? [hotel.image_url] : []);
//       } finally {
//         setImagesLoading(false);
//       }
//     };
//     loadImgs();
//   }, [hotel]);

//   const handleBookNow = () => setShowBookingModal(true);

//   const handleConfirmBooking = async () => {
//     setShowBookingModal(false);
//     const url =
//       hotel.website ||
//       hotel.google_maps_url ||
//       `https://www.booking.com/search.html?ss=${encodeURIComponent((hotel.name || '') + ' ' + (hotel.location || ''))}`;
//     try {
//       await Linking.openURL(url);
//     } catch (e) {
//       console.error('[HotelDetail] booking URL error', e);
//     }
//   };

//   const price = hotel?.price_info?.min ?? nightlyRate ?? 85;
//   const rating = hotel?.rating ?? 0;

//   // ── Sentiment percentages from real NLP data ──────────────────────────────
//   // Prefer the pre-computed per-label counts; fall back to positive_pct+remainder
//   // only when no raw counts are available.
//   let positiveScore, negScore, neuScore;
//   const total = hotel?.total_reviews ?? 0;
//   const posCount = hotel?.positive_reviews ?? null;
//   const negCount = hotel?.negative_reviews ?? null;
//   const neuCount = hotel?.neutral_reviews ?? null;

//   if (total > 0 && posCount !== null && negCount !== null && neuCount !== null) {
//     // All three counts available — compute directly so they sum to exactly 100
//     positiveScore = Math.round((posCount / total) * 100);
//     negScore = Math.round((negCount / total) * 100);
//     // Assign remainder to neutral to guarantee sum = 100
//     neuScore = 100 - positiveScore - negScore;
//   } else if (hotel?.positive_pct != null && total > 0 && negCount !== null) {
//     positiveScore = hotel.positive_pct;
//     negScore = Math.round((negCount / total) * 100);
//     neuScore = 100 - positiveScore - negScore;
//   } else if (hotel?.positive_pct != null) {
//     // Only positive_pct known — split remainder evenly between neu/neg
//     positiveScore = hotel.positive_pct;
//     negScore = Math.round((100 - positiveScore) * 0.4);
//     neuScore = 100 - positiveScore - negScore;
//   } else {
//     // Absolute fallback (no NLP data served at all)
//     positiveScore = 80;
//     negScore = 10;
//     neuScore = 10;
//   }
//   // Guard against negative neutral (rounding edge case)
//   if (neuScore < 0) { negScore += neuScore; neuScore = 0; }

//   const tags = [
//     ...LOCATION_TAGS(hotel?.location),
//     ...getRatingTags(hotel?.name, rating),
//     ...(hotel?.amenities?.slice(0, 2) || []).map(a => AMENITY_ICON[a]?.name || a),
//   ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

//   // ── Loading / Error ──
//   if (loading) return (
//     <View style={styles.center}>
//       <ActivityIndicator size="large" color="#f59e0b" />
//       <Text style={styles.loadingText}>Loading hotel...</Text>
//     </View>
//   );

//   if (error || !hotel) return (
//     <View style={styles.center}>
//       <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
//       <Text style={styles.errorText}>{error || 'Hotel not found'}</Text>
//       <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
//         <Text style={styles.retryBtnText}>Go Back</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // ── Tab content ──
//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'Overview':
//         return (
//           <View>
//             {/* About */}
//             <View style={styles.card}>
//               <Text style={styles.cardTitle}>About this hotel</Text>
//               <Text style={styles.cardBody}>
//                 {hotel.description
//                   ? hotel.description
//                   : `${hotel.name} is a ${hotel.price_info?.tier ?? 'hotel'} located in ${hotel.location}, rated ${rating.toFixed(1)} by ${hotel.total_reviews ?? 0} guests.`}
//               </Text>
//             </View>
//             {/* Sentiment */}
//             <View style={styles.card}>
//               <Text style={styles.cardTitle}>Guest Sentiment Analysis</Text>
//               {[
//                 { label: 'Positive', pct: positiveScore, color: '#22c55e' },
//                 { label: 'Neutral', pct: neuScore, color: '#f59e0b' },
//                 { label: 'Negative', pct: negScore, color: '#ef4444' },
//               ].map(row => (
//                 <View key={row.label} style={styles.sentimentRow}>
//                   <Ionicons
//                     name={row.label === 'Positive' ? 'thumbs-up-outline' : row.label === 'Negative' ? 'thumbs-down-outline' : 'remove-outline'}
//                     size={16} color={row.color} />
//                   <Text style={styles.sentimentLabel}>{row.label}</Text>
//                   <View style={styles.sentimentBarBg}>
//                     <View style={[styles.sentimentBar, { width: `${row.pct}%`, backgroundColor: row.color }]} />
//                   </View>
//                   <Text style={[styles.sentimentPct, { color: row.color }]}>{row.pct}%</Text>
//                 </View>
//               ))}
//             </View>
//             {/* Contact */}
//             {(hotel.phone || hotel.website || hotel.google_maps_url) && (
//               <View style={styles.card}>
//                 <Text style={styles.cardTitle}>Contact & Info</Text>
//                 {hotel.google_maps_url && (
//                   <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(hotel.google_maps_url)}>
//                     <Ionicons name="map-outline" size={18} color="#3b82f6" />
//                     <Text style={styles.contactLink}>Open in Google Maps</Text>
//                   </TouchableOpacity>
//                 )}
//                 {hotel.website && (
//                   <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(hotel.website)}>
//                     <Ionicons name="globe-outline" size={18} color="#3b82f6" />
//                     <Text style={styles.contactLink} numberOfLines={1}>
//                       {hotel.website.replace(/^https?:\/\/(www\.)?/, '')}
//                     </Text>
//                   </TouchableOpacity>
//                 )}
//                 {hotel.phone && (
//                   <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${hotel.phone}`)}>
//                     <Ionicons name="call-outline" size={18} color="#3b82f6" />
//                     <Text style={styles.contactLink}>{hotel.phone}</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             )}
//           </View>
//         );

//       case 'Amenities':
//         return (
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>Available Amenities</Text>
//             <View style={styles.amenityGrid}>
//               {(hotel.amenities?.length > 0 ? hotel.amenities : ['Free WiFi', 'Restaurant', 'Parking'])
//                 .map((label) => {
//                   const meta = AMENITY_ICON[label] || { icon: '✓', name: label };
//                   return (
//                     <View key={label} style={styles.amenityItem}>
//                       <View style={styles.amenityIconBox}>
//                         <Text style={styles.amenityEmoji}>{meta.icon}</Text>
//                       </View>
//                       <Text style={styles.amenityName} numberOfLines={2}>{meta.name}</Text>
//                     </View>
//                   );
//                 })}
//             </View>
//           </View>
//         );

//       case 'Reviews':
//         const reviews = hotel.reviews?.filter(r => r.review_text?.length > 20).slice(0, 10) || [];
//         return reviews.length > 0 ? (
//           <View>
//             {reviews.map((r, i) => {
//               const initials = `${String.fromCharCode(65 + (i % 26))}`;
//               return (
//                 <View key={i} style={[styles.card, { marginBottom: 10 }]}>
//                   <View style={styles.reviewHeader}>
//                     <View style={styles.reviewAvatar}>
//                       <Text style={styles.reviewAvatarText}>{initials}</Text>
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.reviewerName}>Guest {initials}.</Text>
//                       <Text style={styles.reviewDate}>
//                         {r.date_of_review ? new Date(r.date_of_review).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2025'}
//                       </Text>
//                     </View>
//                     <View style={styles.reviewStars}>
//                       {[1, 2, 3, 4, 5].map(s => (
//                         <Ionicons key={s} name={s <= Math.round((r.sentiment_score ?? 0.5) * 5) ? 'star' : 'star-outline'}
//                           size={13} color="#f59e0b" />
//                       ))}
//                     </View>
//                   </View>
//                   <Text style={styles.reviewText} numberOfLines={5}>{r.review_text}</Text>
//                 </View>
//               );
//             })}
//           </View>
//         ) : (
//           <View style={styles.card}>
//             <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 20 }}>No reviews available yet.</Text>
//           </View>
//         );



//       default:
//         return null;
//     }
//   };

//   return (
//     <View style={styles.root}>
//       {/* ── Image gallery ── */}
//       <View style={styles.galleryContainer}>
//         {imagesLoading ? (
//           <View style={styles.galleryPlaceholder}>
//             <ActivityIndicator color="#f59e0b" size="large" />
//           </View>
//         ) : images.length > 0 ? (
//           <Image source={{ uri: images[currentIdx] }} style={styles.galleryImage} resizeMode="cover" />
//         ) : (
//           <View style={[styles.galleryImage, styles.galleryPlaceholder]}>
//             <Ionicons name="bed" size={48} color="#94a3b8" />
//           </View>
//         )}

//         {/* Counter */}
//         {images.length > 1 && (
//           <View style={styles.imageCounter}>
//             <Text style={styles.imageCounterText}>{currentIdx + 1} / {images.length}</Text>
//           </View>
//         )}

//         {/* Back / Share / Heart */}
//         <SafeAreaView edges={['top']} style={styles.galleryOverlay}>
//           <TouchableOpacity style={styles.galleryBtn} onPress={() => navigation.goBack()}>
//             <Ionicons name="chevron-back" size={22} color="#fff" />
//           </TouchableOpacity>
//           <View style={styles.galleryRightBtns}>
//             <TouchableOpacity style={styles.galleryBtn}>
//               <Ionicons name="share-outline" size={20} color="#fff" />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.galleryBtn} onPress={() => setLiked(!liked)}>
//               <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#ef4444' : '#fff'} />
//             </TouchableOpacity>
//           </View>
//         </SafeAreaView>

//         {/* Thumbnail strip */}
//         {images.length > 1 && (
//           <ScrollView
//             horizontal showsHorizontalScrollIndicator={false}
//             style={styles.thumbnailStrip}
//             contentContainerStyle={styles.thumbnailContent}
//           >
//             {images.map((url, i) => (
//               <TouchableOpacity key={i} onPress={() => setCurrentIdx(i)}
//                 style={[styles.thumbWrap, i === currentIdx && styles.thumbActive]}>
//                 <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         )}
//       </View>

//       {/* ── Scrollable content ── */}
//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

//         {/* Hotel name */}
//         <View style={styles.nameRow}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.hotelName}>{hotel.name}</Text>
//             <View style={styles.locRow}>
//               <Ionicons name="location-outline" size={14} color="#64748b" />
//               <Text style={styles.locText}>{hotel.location}</Text>
//             </View>
//           </View>
//         </View>

//         {/* Rating + price */}
//         <View style={styles.ratingPriceRow}>
//           <View style={styles.starsRow}>
//             {[1, 2, 3, 4, 5].map(s => (
//               <Ionicons key={s} name={s <= Math.floor(rating) ? 'star' : s - 0.5 <= rating ? 'star-half' : 'star-outline'}
//                 size={16} color="#f59e0b" />
//             ))}
//             <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
//             <Text style={styles.reviewsCount}>({hotel.total_reviews ?? 0} reviews)</Text>
//           </View>
//           <Text style={styles.priceTag}>
//             <Text style={styles.priceDollar}>${price}</Text>
//             <Text style={styles.priceUnit}>/night</Text>
//           </Text>
//         </View>

//         {/* Tags */}
//         {tags.length > 0 && (
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}
//             contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
//             {tags.map(tag => (
//               <View key={tag} style={styles.tagChip}>
//                 <Text style={styles.tagText}>{tag}</Text>
//               </View>
//             ))}
//           </ScrollView>
//         )}

//         {/* Price range banner */}
//         {hotel.price_info && (
//           <View style={styles.priceRangeBanner}>
//             <Text style={styles.priceRangeText}>
//               🔥 Price range: ${hotel.price_info.min}–${hotel.price_info.max}/night
//             </Text>
//           </View>
//         )}

//         {/* Tabs */}
//         <View style={styles.tabBar}>
//           {TABS.map(tab => (
//             <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]}
//               onPress={() => setActiveTab(tab)}>
//               <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Tab content */}
//         <View style={styles.tabContent}>
//           {renderTabContent()}
//         </View>

//         <View style={{ height: 100 }} />
//       </ScrollView>

//       {/* ── Footer ── */}
//       <SafeAreaView edges={['bottom']} style={styles.footer}>
//         <View>
//           <Text style={styles.footerFrom}>From</Text>
//           <Text style={styles.footerPrice}>
//             <Text style={styles.footerPriceDollar}>${price}</Text>
//             <Text style={styles.footerPriceUnit}>/night</Text>
//           </Text>
//         </View>
//         <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow}>
//           <Text style={styles.bookBtnText}>Book Now</Text>
//           <Ionicons name="arrow-forward" size={18} color="#fff" />
//         </TouchableOpacity>
//       </SafeAreaView>

//       {/* ── Booking Redirect Modal ── */}
//       <Modal visible={showBookingModal} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalCard}>
//             <View style={styles.modalIcon}>
//               <Text style={{ fontSize: 36 }}>🏨</Text>
//             </View>
//             <Text style={styles.modalTitle}>Redirecting to Booking Partner</Text>
//             <Text style={styles.modalBody}>
//               You will be redirected to our trusted booking partner to complete your reservation for{' '}
//               <Text style={styles.modalHotelName}>{hotel.name}</Text>.
//             </Text>
//             <View style={styles.modalBtns}>
//               <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBookingModal(false)}>
//                 <Text style={styles.modalCancelText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.modalContinueBtn} onPress={handleConfirmBooking}>
//                 <Text style={styles.modalContinueText}>Continue</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   root: { flex: 1, backgroundColor: '#f8fafc' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
//   loadingText: { marginTop: 12, fontSize: 15, color: '#64748b' },
//   errorText: { marginTop: 12, fontSize: 15, color: '#ef4444', textAlign: 'center' },
//   retryBtn: { marginTop: 20, backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
//   retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

//   // Gallery
//   galleryContainer: { width: '100%', backgroundColor: '#e2e8f0' },
//   galleryImage: { width: '100%', height: 280 },
//   galleryPlaceholder: { height: 280, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' },
//   galleryOverlay: {
//     position: 'absolute', top: 0, left: 0, right: 0,
//     flexDirection: 'row', justifyContent: 'space-between',
//     paddingHorizontal: 16, paddingTop: 8,
//   },
//   galleryRightBtns: { flexDirection: 'row', gap: 8 },
//   galleryBtn: {
//     width: 40, height: 40, borderRadius: 20,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   imageCounter: {
//     position: 'absolute', bottom: 60, right: 14,
//     backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
//     paddingHorizontal: 10, paddingVertical: 4,
//   },
//   imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
//   thumbnailStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, backgroundColor: 'rgba(0,0,0,0.25)' },
//   thumbnailContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
//   thumbWrap: { width: 48, height: 40, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
//   thumbActive: { borderColor: '#f59e0b' },
//   thumb: { width: '100%', height: '100%' },

//   // Content
//   content: { flex: 1 },

//   // Hotel name section
//   nameRow: {
//     flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
//     paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
//     backgroundColor: '#fff',
//   },
//   hotelName: { fontSize: 22, fontWeight: '800', color: '#0c2340', flex: 1, lineHeight: 28 },
//   locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
//   locText: { fontSize: 13, color: '#64748b' },
//   matchBadge: {
//     flexDirection: 'row', alignItems: 'center', gap: 4,
//     backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginLeft: 12,
//   },
//   matchText: { color: '#fff', fontSize: 12, fontWeight: '700' },

//   // Rating + price
//   ratingPriceRow: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff',
//   },
//   starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
//   ratingNum: { fontSize: 14, fontWeight: '700', color: '#0c2340', marginLeft: 4 },
//   reviewsCount: { fontSize: 12, color: '#94a3b8' },
//   priceTag: {},
//   priceDollar: { fontSize: 22, fontWeight: '800', color: '#f59e0b' },
//   priceUnit: { fontSize: 13, color: '#94a3b8' },

//   // Tags
//   tagChip: {
//     backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
//     borderWidth: 1, borderColor: '#e2e8f0',
//   },
//   tagText: { fontSize: 12, fontWeight: '600', color: '#475569' },

//   // Price range banner
//   priceRangeBanner: {
//     marginHorizontal: 16, marginBottom: 16, marginTop: 4,
//     backgroundColor: '#fff7ed', borderRadius: 12,
//     paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#fed7aa',
//   },
//   priceRangeText: { fontSize: 13, color: '#c2410c', fontWeight: '600' },

//   // Tab bar
//   tabBar: {
//     flexDirection: 'row', backgroundColor: '#fff',
//     marginHorizontal: 16, borderRadius: 12,
//     padding: 4, marginBottom: 14,
//     elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
//   },
//   tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
//   tabActive: { backgroundColor: '#0c2340' },
//   tabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
//   tabTextActive: { color: '#fff', fontWeight: '700' },

//   // Tab content
//   tabContent: { paddingHorizontal: 16 },
//   card: {
//     backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
//     elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
//   },
//   cardTitle: { fontSize: 16, fontWeight: '800', color: '#0c2340', marginBottom: 12 },
//   cardBody: { fontSize: 14, color: '#475569', lineHeight: 22 },

//   // Sentiment
//   sentimentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
//   sentimentLabel: { fontSize: 13, color: '#475569', width: 68 },
//   sentimentBarBg: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
//   sentimentBar: { height: '100%', borderRadius: 4 },
//   sentimentPct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },

//   // Contact
//   contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
//   contactLink: { fontSize: 14, color: '#3b82f6', flex: 1 },

//   // Amenities grid
//   amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
//   amenityItem: { width: (SCREEN_WIDTH - 32 - 32 - 36) / 3, alignItems: 'center' },
//   amenityIconBox: {
//     width: 56, height: 56, borderRadius: 16,
//     backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
//     justifyContent: 'center', alignItems: 'center', marginBottom: 6,
//   },
//   amenityEmoji: { fontSize: 22 },
//   amenityName: { fontSize: 11, color: '#475569', fontWeight: '600', textAlign: 'center' },

//   // Reviews
//   reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
//   reviewAvatar: {
//     width: 40, height: 40, borderRadius: 20,
//     backgroundColor: '#0c2340', justifyContent: 'center', alignItems: 'center',
//   },
//   reviewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
//   reviewerName: { fontSize: 14, fontWeight: '700', color: '#0c2340' },
//   reviewDate: { fontSize: 12, color: '#94a3b8' },
//   reviewStars: { flexDirection: 'row', gap: 2 },
//   reviewText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 10 },
//   reviewTags: { flexDirection: 'row', gap: 8 },

//   langTag: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//   langTagText: { fontSize: 11, color: '#1d4ed8', fontWeight: '600' },



//   // Footer
//   footer: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//     paddingHorizontal: 20, paddingVertical: 12,
//     backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
//   },
//   footerFrom: { fontSize: 12, color: '#94a3b8' },
//   footerPrice: {},
//   footerPriceDollar: { fontSize: 24, fontWeight: '900', color: '#0c2340' },
//   footerPriceUnit: { fontSize: 13, color: '#94a3b8' },
//   bookBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     backgroundColor: '#f59e0b', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16,
//   },
//   bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

//   // Modal
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
//   modalCard: {
//     backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
//     width: '100%', elevation: 10,
//   },
//   modalIcon: {
//     width: 72, height: 72, borderRadius: 20, backgroundColor: '#fff7ed',
//     justifyContent: 'center', alignItems: 'center', marginBottom: 18,
//   },
//   modalTitle: { fontSize: 19, fontWeight: '800', color: '#0c2340', marginBottom: 12, textAlign: 'center' },
//   modalBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
//   modalHotelName: { color: '#f59e0b', fontWeight: '700' },
//   modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
//   modalCancelBtn: {
//     flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center',
//   },
//   modalCancelText: { fontSize: 15, fontWeight: '700', color: '#475569' },
//   modalContinueBtn: {
//     flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f59e0b', alignItems: 'center',
//   },
//   modalContinueText: { fontSize: 15, fontWeight: '800', color: '#fff' },
// });

// export default HotelDetailScreen;


import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hotelApiService from '../services/hotelApiService';

const LIKED_HOTELS_KEY = 'liked_hotels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Amenity icon mapping ─────────────────────────────────────────────────────
const AMENITY_ICON = {
  'Swimming Pool': { icon: '🌊', name: 'Pool' },
  'Beach Access': { icon: '🏖️', name: 'Beach Access' },
  'Spa & Wellness': { icon: '✨', name: 'Spa' },
  'Fitness Centre': { icon: '🥊', name: 'Gym' },
  'Restaurant': { icon: '🍴', name: 'Restaurant' },
  'Bar / Lounge': { icon: '🍺', name: 'Bar' },
  'Free WiFi': { icon: '📶', name: 'WiFi' },
  'Parking': { icon: '🚗', name: 'Parking' },
  'Airport Transfer': { icon: '✈️', name: 'Transfer' },
  'Nature / Wildlife': { icon: '🌿', name: 'Nature' },
  'Lakeside / Riverside': { icon: '⛵', name: 'Lakeside' },
  'Rooftop': { icon: '🏢', name: 'Rooftop' },
  'Business Facilities': { icon: '💼', name: 'Business' },
  'Family Friendly': { icon: '👨‍👩‍👧', name: 'Family' },
  'Pet Friendly': { icon: '🐾', name: 'Pet Friendly' },
  'Scenic Views': { icon: '🔭', name: 'Scenic' },
  'Tea Plantation': { icon: '☕', name: 'Tea' },
  'Surfing': { icon: '🏄', name: 'Surfing' },
  'Water Sports': { icon: '🐠', name: 'Water Sports' },
  'Air Conditioning': { icon: '❄️', name: 'A/C' },
  'Room Service': { icon: '🛎️', name: 'Room Service' },
};

// ─── Tags shown under hotel name ──────────────────────────────────────────────
const LOCATION_TAGS = (location = '') => {
  const loc = location.toLowerCase();
  const tags = [];
  if (['beach', 'coast', 'galle', 'bentota', 'hikkaduwa', 'negombo', 'trincomalee',
    'mirissa', 'unawatuna', 'ahungalla', 'tangalle'].some(k => loc.includes(k))) tags.push('Beachfront');
  if (loc.includes('kandy') || loc.includes('nuwara') || loc.includes('sigiriya')) tags.push('Cultural');
  return tags;
};

const getRatingTags = (name = '', rating = 0) => {
  const tags = [];
  const n = name.toLowerCase();
  if (['jetwing', 'cinnamon', 'heritance', 'shangri', 'hilton', 'marriott', 'anantara', 'uga'].some(k => n.includes(k)) || rating >= 4.5)
    tags.push('Luxury');
  if (n.includes('spa') || n.includes('retreat') || n.includes('wellness')) tags.push('Spa');
  return tags;
};



// ─── Main Screen ──────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Amenities', 'Reviews', 'AI Insights'];

const HotelDetailScreen = ({ route, navigation }) => {
  const { hotelId, nightlyRate } = route.params || {};
  const [hotel, setHotel] = useState(null);
  const [images, setImages] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const aiLoadedFor = useRef(null);

  // Show toast helper
  const showToast = useCallback((msg) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(''));
  }, [toastAnim]);

  // Load hotel details
  useEffect(() => {
    const load = async () => {
      if (!hotelId) { setError('Hotel ID missing'); setLoading(false); return; }
      try {
        const details = await hotelApiService.getHotelDetails(hotelId);
        setHotel(details);
        navigation.setOptions({ title: details.name || 'Hotel Details' });
      } catch (err) {
        setError(err.message || 'Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hotelId]);

  // Restore liked state from AsyncStorage
  useEffect(() => {
    const restoreLiked = async () => {
      try {
        const raw = await AsyncStorage.getItem(LIKED_HOTELS_KEY);
        const likedSet = raw ? new Set(JSON.parse(raw)) : new Set();
        setLiked(likedSet.has(Number(hotelId)) || likedSet.has(String(hotelId)));
      } catch (e) {
        console.warn('[HotelDetail] Failed to restore liked state', e);
      }
    };
    if (hotelId) restoreLiked();
  }, [hotelId]);

  // Load images
  useEffect(() => {
    if (!hotel) return;
    const loadImgs = async () => {
      try {
        const list = await hotelApiService.getHotelImages(hotelId);
        const urls = list?.map((img) => img.url || img) || [];
        setImages(urls.length > 0 ? urls : hotel.image_url ? [hotel.image_url] : []);
      } catch {
        setImages(hotel.image_url ? [hotel.image_url] : []);
      } finally {
        setImagesLoading(false);
      }
    };
    loadImgs();
  }, [hotel]);

  // Toggle favourite: persist to AsyncStorage + inform backend
  const handleToggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      // Persist to AsyncStorage
      const raw = await AsyncStorage.getItem(LIKED_HOTELS_KEY);
      const likedArr = raw ? JSON.parse(raw) : [];
      const likedSet = new Set(likedArr);
      if (newLiked) {
        likedSet.add(Number(hotelId));
        showToast('❤️ Added to favourites! Improving your recommendations...');
      } else {
        likedSet.delete(Number(hotelId));
        likedSet.delete(String(hotelId));
        showToast('Removed from favourites');
      }
      await AsyncStorage.setItem(LIKED_HOTELS_KEY, JSON.stringify([...likedSet]));
      // Inform backend (5.0 = liked, 1.0 = un-liked)
      await hotelApiService.submitFavourite(Number(hotelId), newLiked ? 5.0 : 1.0);
    } catch (e) {
      console.warn('[HotelDetail] submitFavourite error', e);
    }
  };

  const handleBookNow = () => setShowBookingModal(true);

  const handleConfirmBooking = async () => {
    setShowBookingModal(false);
    const url =
      hotel.website ||
      hotel.google_maps_url ||
      `https://www.booking.com/search.html?ss=${encodeURIComponent((hotel.name || '') + ' ' + (hotel.location || ''))}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error('[HotelDetail] booking URL error', e);
    }
  };

  const price = hotel?.price_info?.min ?? nightlyRate ?? 85;
  const rating = hotel?.rating ?? 0;

  // ── Sentiment percentages from real NLP data ──────────────────────────────
  // Prefer the pre-computed per-label counts; fall back to positive_pct+remainder
  // only when no raw counts are available.
  let positiveScore, negScore, neuScore;
  const total = hotel?.total_reviews ?? 0;
  const posCount = hotel?.positive_reviews ?? null;
  const negCount = hotel?.negative_reviews ?? null;
  const neuCount = hotel?.neutral_reviews ?? null;

  if (total > 0 && posCount !== null && negCount !== null && neuCount !== null) {
    // All three counts available — compute directly so they sum to exactly 100
    positiveScore = Math.round((posCount / total) * 100);
    negScore = Math.round((negCount / total) * 100);
    // Assign remainder to neutral to guarantee sum = 100
    neuScore = 100 - positiveScore - negScore;
  } else if (hotel?.positive_pct != null && total > 0 && negCount !== null) {
    positiveScore = hotel.positive_pct;
    negScore = Math.round((negCount / total) * 100);
    neuScore = 100 - positiveScore - negScore;
  } else if (hotel?.positive_pct != null) {
    // Only positive_pct known — split remainder evenly between neu/neg
    positiveScore = hotel.positive_pct;
    negScore = Math.round((100 - positiveScore) * 0.4);
    neuScore = 100 - positiveScore - negScore;
  } else {
    // Absolute fallback (no NLP data served at all)
    positiveScore = 80;
    negScore = 10;
    neuScore = 10;
  }
  // Guard against negative neutral (rounding edge case)
  if (neuScore < 0) { negScore += neuScore; neuScore = 0; }

  // Lazy-load AI Insights when that tab is first selected
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'AI Insights' && aiLoadedFor.current !== hotelId && !aiLoading) {
      aiLoadedFor.current = hotelId;
      setAiLoading(true);
      setAiError(null);
      hotelApiService.getAiInsights(Number(hotelId))
        .then(data => { setAiInsights(data); setAiLoading(false); })
        .catch(err => { setAiError(err.message || 'Failed to load AI insights'); setAiLoading(false); });
    }
  };

  const tags = [
    ...LOCATION_TAGS(hotel?.location),
    ...getRatingTags(hotel?.name, rating),
    ...(hotel?.amenities?.slice(0, 2) || []).map(a => AMENITY_ICON[a]?.name || a),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

  // ── Loading / Error ──
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#f59e0b" />
      <Text style={styles.loadingText}>Loading hotel...</Text>
    </View>
  );

  if (error || !hotel) return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
      <Text style={styles.errorText}>{error || 'Hotel not found'}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.retryBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Tab content ──
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <View>
            {/* About */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About this hotel</Text>
              <Text style={styles.cardBody}>
                {hotel.description
                  ? hotel.description
                  : `${hotel.name} is a ${hotel.price_info?.tier ?? 'hotel'} located in ${hotel.location}, rated ${rating.toFixed(1)} by ${hotel.total_reviews ?? 0} guests.`}
              </Text>
            </View>
            {/* Sentiment */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Guest Sentiment Analysis</Text>
              {[
                { label: 'Positive', pct: positiveScore, color: '#22c55e' },
                { label: 'Neutral', pct: neuScore, color: '#f59e0b' },
                { label: 'Negative', pct: negScore, color: '#ef4444' },
              ].map(row => (
                <View key={row.label} style={styles.sentimentRow}>
                  <Ionicons
                    name={row.label === 'Positive' ? 'thumbs-up-outline' : row.label === 'Negative' ? 'thumbs-down-outline' : 'remove-outline'}
                    size={16} color={row.color} />
                  <Text style={styles.sentimentLabel}>{row.label}</Text>
                  <View style={styles.sentimentBarBg}>
                    <View style={[styles.sentimentBar, { width: `${row.pct}%`, backgroundColor: row.color }]} />
                  </View>
                  <Text style={[styles.sentimentPct, { color: row.color }]}>{row.pct}%</Text>
                </View>
              ))}
            </View>
            {/* Contact & Info — always show Maps button (free, no API key needed) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact & Info</Text>

              {/* Google Maps button — built from hotel name + location, same as location screen */}
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => {
                  const query = encodeURIComponent(
                    `${hotel.name || ''} ${hotel.location || ''} Sri Lanka`
                  );
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                }}
              >
                <Ionicons name="map-outline" size={18} color="#3b82f6" />
                <Text style={styles.contactLink}>Open in Google Maps</Text>
              </TouchableOpacity>

              {hotel.website && (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(hotel.website)}>
                  <Ionicons name="globe-outline" size={18} color="#3b82f6" />
                  <Text style={styles.contactLink} numberOfLines={1}>
                    {hotel.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </Text>
                </TouchableOpacity>
              )}
              {hotel.phone && (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${hotel.phone}`)}>
                  <Ionicons name="call-outline" size={18} color="#3b82f6" />
                  <Text style={styles.contactLink}>{hotel.phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'Amenities':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Available Amenities</Text>
            <View style={styles.amenityGrid}>
              {(hotel.amenities?.length > 0 ? hotel.amenities : ['Free WiFi', 'Restaurant', 'Parking'])
                .map((label) => {
                  const meta = AMENITY_ICON[label] || { icon: '✓', name: label };
                  return (
                    <View key={label} style={styles.amenityItem}>
                      <View style={styles.amenityIconBox}>
                        <Text style={styles.amenityEmoji}>{meta.icon}</Text>
                      </View>
                      <Text style={styles.amenityName} numberOfLines={2}>{meta.name}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        );

      case 'Reviews':
        const reviews = hotel.reviews?.filter(r => r.review_text?.length > 20).slice(0, 10) || [];
        return reviews.length > 0 ? (
          <View>
            {reviews.map((r, i) => {
              const initials = `${String.fromCharCode(65 + (i % 26))}`;
              return (
                <View key={i} style={[styles.card, { marginBottom: 10 }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewerName}>Guest {initials}.</Text>
                      <Text style={styles.reviewDate}>
                        {r.date_of_review ? new Date(r.date_of_review).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2025'}
                      </Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons key={s} name={s <= Math.round((r.sentiment_score ?? 0.5) * 5) ? 'star' : 'star-outline'}
                          size={13} color="#f59e0b" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={5}>{r.review_text}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 20 }}>No reviews available yet.</Text>
          </View>
        );



      default:
        // ── AI Insights tab ──────────────────────────────────────────────
        if (activeTab !== 'AI Insights') return null;

        if (aiLoading) return (
          <View style={styles.aiLoadingBox}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.aiLoadingText}>✨ Gemini is analysing this hotel...</Text>
            <Text style={styles.aiLoadingSubtext}>Reading {hotel.total_reviews ?? 0} guest reviews</Text>
          </View>
        );

        if (aiError) return (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: '#ef4444' }]}>⚠️ Could not load AI Insights</Text>
            <Text style={styles.cardBody}>{aiError}</Text>
            <TouchableOpacity
              style={styles.aiRetryBtn}
              onPress={() => { aiLoadedFor.current = null; handleTabPress('AI Insights'); }}
            >
              <Text style={styles.aiRetryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );

        if (!aiInsights) return (
          <View style={styles.card}>
            <Text style={styles.cardBody}>Tap "AI Insights" tab to generate AI analysis.</Text>
          </View>
        );

        // ── Render rich insights ──────────────────────────────────────────
        const score = aiInsights.ai_score ?? 0;
        const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

        return (
          <View>
            {/* Score Card */}
            <View style={[styles.card, styles.aiScoreCard]}>
              <View style={styles.aiScoreLeft}>
                <Text style={styles.aiScoreLabel}>AI Score</Text>
                <Text style={[styles.aiScoreValue, { color: scoreColor }]}>{score}</Text>
                <Text style={styles.aiScoreMax}>/100</Text>
              </View>
              <View style={styles.aiScoreRight}>
                <View style={styles.aiScoreBarBg}>
                  <View style={[styles.aiScoreBarFill, { width: `${score}%`, backgroundColor: scoreColor }]} />
                </View>
                <Text style={styles.aiVerdict}>{aiInsights.verdict}</Text>
              </View>
            </View>

            {/* Strengths */}
            <View style={styles.card}>
              <Text style={styles.aiSectionTitle}>✅ Top Strengths</Text>
              {(aiInsights.strengths || []).map((s, i) => (
                <View key={i} style={styles.aiListRow}>
                  <View style={[styles.aiDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.aiListText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Watch Out */}
            {(aiInsights.watch_out || []).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.aiSectionTitle}>⚠️ Watch Out For</Text>
                {(aiInsights.watch_out || []).map((w, i) => (
                  <View key={i} style={styles.aiListRow}>
                    <View style={[styles.aiDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={styles.aiListText}>{w}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Best For */}
            <View style={styles.card}>
              <Text style={styles.aiSectionTitle}>🎯 Best For</Text>
              <View style={styles.aiBestForRow}>
                {(aiInsights.best_for || []).map((b, i) => (
                  <View key={i} style={styles.aiBestForChip}>
                    <Text style={styles.aiBestForText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Best Time */}
            {aiInsights.best_time ? (
              <View style={styles.card}>
                <Text style={styles.aiSectionTitle}>🌦️ Best Time to Visit</Text>
                <Text style={styles.cardBody}>{aiInsights.best_time}</Text>
              </View>
            ) : null}

            {/* Guest Quote */}
            {aiInsights.guest_quote ? (
              <View style={[styles.card, styles.aiQuoteCard]}>
                <Text style={styles.aiQuoteIcon}>"</Text>
                <Text style={styles.aiQuoteText}>{aiInsights.guest_quote}</Text>
                <Text style={styles.aiQuoteFooter}>— Real Guest Review</Text>
              </View>
            ) : null}

            {/* Footer */}
            <Text style={styles.aiFooter}>✨ Generated by Gemini AI · Based on {hotel.total_reviews ?? 0} reviews</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Image gallery ── */}
      <View style={styles.galleryContainer}>
        {imagesLoading ? (
          <View style={styles.galleryPlaceholder}>
            <ActivityIndicator color="#f59e0b" size="large" />
          </View>
        ) : images.length > 0 ? (
          <Image source={{ uri: images[currentIdx] }} style={styles.galleryImage} resizeMode="cover" />
        ) : (
          <View style={[styles.galleryImage, styles.galleryPlaceholder]}>
            <Ionicons name="bed" size={48} color="#94a3b8" />
          </View>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>{currentIdx + 1} / {images.length}</Text>
          </View>
        )}

        {/* Overlay: back arrow left, heart right */}
        <SafeAreaView edges={['top']} style={styles.galleryOverlay}>
          <TouchableOpacity style={styles.galleryBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.galleryRightBtns}>
            <TouchableOpacity style={styles.galleryBtn} onPress={handleToggleLike}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#ef4444' : '#fff'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={styles.thumbnailStrip}
            contentContainerStyle={styles.thumbnailContent}
          >
            {images.map((url, i) => (
              <TouchableOpacity key={i} onPress={() => setCurrentIdx(i)}
                style={[styles.thumbWrap, i === currentIdx && styles.thumbActive]}>
                <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hotel name */}
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.locText}>{hotel.location}</Text>
            </View>
          </View>
        </View>

        {/* Rating + price */}
        <View style={styles.ratingPriceRow}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <Ionicons key={s} name={s <= Math.floor(rating) ? 'star' : s - 0.5 <= rating ? 'star-half' : 'star-outline'}
                size={16} color="#f59e0b" />
            ))}
            <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
            <Text style={styles.reviewsCount}>({hotel.total_reviews ?? 0} reviews)</Text>
          </View>
          <Text style={styles.priceTag}>
            <Text style={styles.priceDollar}>${price}</Text>
            <Text style={styles.priceUnit}>/night</Text>
          </Text>
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Price range banner */}
        {hotel.price_info && (
          <View style={styles.priceRangeBanner}>
            <Text style={styles.priceRangeText}>
              🔥 Price range: ${hotel.price_info.min}–${hotel.price_info.max}/night
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabPress(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Favourite Toast ── */}
      {toast !== '' && (
        <Animated.View style={[styles.toastContainer, { opacity: toastAnim }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      {/* ── Footer ── */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View>
          <Text style={styles.footerFrom}>From</Text>
          <Text style={styles.footerPrice}>
            <Text style={styles.footerPriceDollar}>${price}</Text>
            <Text style={styles.footerPriceUnit}>/night</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow}>
          <Text style={styles.bookBtnText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Booking Redirect Modal ── */}
      <Modal visible={showBookingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Text style={{ fontSize: 36 }}>🏨</Text>
            </View>
            <Text style={styles.modalTitle}>Redirecting to Booking Partner</Text>
            <Text style={styles.modalBody}>
              You will be redirected to our trusted booking partner to complete your reservation for{' '}
              <Text style={styles.modalHotelName}>{hotel.name}</Text>.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBookingModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalContinueBtn} onPress={handleConfirmBooking}>
                <Text style={styles.modalContinueText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#64748b' },
  errorText: { marginTop: 12, fontSize: 15, color: '#ef4444', textAlign: 'center' },

  // Toast
  toastContainer: {
    position: 'absolute', bottom: 110, left: 20, right: 20,
    backgroundColor: 'rgba(12,35,64,0.92)', borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center',
    elevation: 10,
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Gallery
  galleryContainer: { width: '100%', backgroundColor: '#e2e8f0' },
  galleryImage: { width: '100%', height: 280 },
  galleryPlaceholder: { height: 280, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' },
  galleryOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  galleryRightBtns: { flexDirection: 'row', gap: 8 },
  galleryBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  imageCounter: {
    position: 'absolute', bottom: 60, right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  thumbnailStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, backgroundColor: 'rgba(0,0,0,0.25)' },
  thumbnailContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  thumbWrap: { width: 48, height: 40, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: '#f59e0b' },
  thumb: { width: '100%', height: '100%' },

  // Content
  content: { flex: 1 },

  // Hotel name section
  nameRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
    backgroundColor: '#fff',
  },
  hotelName: { fontSize: 22, fontWeight: '800', color: '#0c2340', flex: 1, lineHeight: 28 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locText: { fontSize: 13, color: '#64748b' },
  matchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginLeft: 12,
  },
  matchText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Rating + price
  ratingPriceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff',
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingNum: { fontSize: 14, fontWeight: '700', color: '#0c2340', marginLeft: 4 },
  reviewsCount: { fontSize: 12, color: '#94a3b8' },
  priceTag: {},
  priceDollar: { fontSize: 22, fontWeight: '800', color: '#f59e0b' },
  priceUnit: { fontSize: 13, color: '#94a3b8' },

  // Tags
  tagChip: {
    backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  tagText: { fontSize: 12, fontWeight: '600', color: '#475569' },

  // Price range banner
  priceRangeBanner: {
    marginHorizontal: 16, marginBottom: 16, marginTop: 4,
    backgroundColor: '#fff7ed', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#fed7aa',
  },
  priceRangeText: { fontSize: 13, color: '#c2410c', fontWeight: '600' },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 16, borderRadius: 12,
    padding: 4, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#0c2340' },
  tabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  // Tab content
  tabContent: { paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0c2340', marginBottom: 12 },
  cardBody: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Sentiment
  sentimentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sentimentLabel: { fontSize: 13, color: '#475569', width: 68 },
  sentimentBarBg: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  sentimentBar: { height: '100%', borderRadius: 4 },
  sentimentPct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },

  // Contact
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  contactLink: { fontSize: 14, color: '#3b82f6', flex: 1 },

  // Amenities grid
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { width: (SCREEN_WIDTH - 32 - 32 - 36) / 3, alignItems: 'center' },
  amenityIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  amenityEmoji: { fontSize: 22 },
  amenityName: { fontSize: 11, color: '#475569', fontWeight: '600', textAlign: 'center' },

  // Reviews
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  reviewAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0c2340', justifyContent: 'center', alignItems: 'center',
  },
  reviewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#0c2340' },
  reviewDate: { fontSize: 12, color: '#94a3b8' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 10 },
  reviewTags: { flexDirection: 'row', gap: 8 },

  langTag: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  langTagText: { fontSize: 11, color: '#1d4ed8', fontWeight: '600' },



  // ── AI Insights Styles ──
  aiLoadingBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center',
    marginVertical: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
  },
  aiLoadingText: { fontSize: 16, fontWeight: '700', color: '#7c3aed', marginTop: 16, marginBottom: 4 },
  aiLoadingSubtext: { fontSize: 13, color: '#94a3b8' },

  aiScoreCard: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  aiScoreLeft: { width: 90, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f1f5f9', paddingRight: 16, marginRight: 16 },
  aiScoreLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  aiScoreValue: { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  aiScoreMax: { fontSize: 11, color: '#94a3b8', marginTop: -4 },
  aiScoreRight: { flex: 1 },
  aiScoreBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  aiScoreBarFill: { height: '100%', borderRadius: 3 },
  aiVerdict: { fontSize: 14, color: '#334155', lineHeight: 20, fontWeight: '500' },

  aiSectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  aiListRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  aiDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, marginRight: 10 },
  aiListText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 22 },

  aiBestForRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiBestForChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  aiBestForText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  aiQuoteCard: { backgroundColor: '#f8fafc', borderLeftWidth: 4, borderLeftColor: '#3b82f6', padding: 20 },
  aiQuoteIcon: { fontSize: 40, color: '#bfdbfe', fontFamily: 'serif', marginTop: -10, marginBottom: -20 },
  aiQuoteText: { fontSize: 15, fontStyle: 'italic', color: '#1e293b', lineHeight: 24, marginBottom: 12 },
  aiQuoteFooter: { fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'right' },

  aiFooter: { textAlign: 'center', fontSize: 12, color: '#94a3b8', marginVertical: 20 },

  aiRetryBtn: { marginTop: 16, backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  aiRetryText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },


  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  footerFrom: { fontSize: 12, color: '#94a3b8' },
  footerPrice: {},
  footerPriceDollar: { fontSize: 24, fontWeight: '900', color: '#0c2340' },
  footerPriceUnit: { fontSize: 13, color: '#94a3b8' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f59e0b', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    width: '100%', elevation: 10,
  },
  modalIcon: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#fff7ed',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#0c2340', marginBottom: 12, textAlign: 'center' },
  modalBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalHotelName: { color: '#f59e0b', fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  modalContinueBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f59e0b', alignItems: 'center',
  },
  modalContinueText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

export default HotelDetailScreen;
