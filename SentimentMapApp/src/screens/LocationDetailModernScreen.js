import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const PREVIEW_GALLERY_COUNT = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_CARD_WIDTH = Math.floor(SCREEN_WIDTH * 0.72);
const GALLERY_CARD_HEIGHT = Math.floor(GALLERY_CARD_WIDTH * 0.62);
const ASPECT_CARD_IMAGE_WIDTH = 92;
const ASPECT_CARD_IMAGE_HEIGHT = 92;

const getShortDescription = (locationName) =>
  `${locationName} is one of Sri Lanka's popular travel destinations, known for scenery, culture, and unique visitor experiences.`;

const ASPECT_IMAGE_BY_KEYWORD = {
  scenery: 'https://img.icons8.com/color/192/panorama.png',
  view: 'https://cdn-icons-png.flaticon.com/128/3643/3643421.png',
  crowd: 'https://img.icons8.com/color/192/group-foreground-selected.png',
  nature: 'https://img.icons8.com/color/192/forest.png',
  culture: 'https://img.icons8.com/color/192/temple.png',
  heritage: 'https://img.icons8.com/color/192/museum.png',
  cleanliness: 'https://img.icons8.com/color/192/broom.png',
  clean: 'https://img.icons8.com/color/192/broom.png',
  safety: 'https://img.icons8.com/color/192/security-checked.png',
  transport: 'https://img.icons8.com/color/192/train.png',
  food: 'https://img.icons8.com/color/192/meal.png',
  hospitality: 'https://img.icons8.com/color/192/handshake--v1.png',
  price: 'https://img.icons8.com/color/192/cheap-2.png',
  accessibility: 'https://img.icons8.com/color/192/accessibility2.png',
  accommodation: 'https://cdn-icons-png.flaticon.com/128/13634/13634769.png',
  accomodation: 'https://cdn-icons-png.flaticon.com/128/13634/13634769.png',
};

const LocationDetailModernScreen = ({ route, navigation }) => {
  const { location } = route.params;
  const [locationData, setLocationData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [travelStats, setTravelStats] = useState({
    distanceKm: '--',
    weatherC: '--',
    sunset: '--',
  });
  const [showSarcastic, setShowSarcastic] = useState(false);

  useEffect(() => {
    setShowAllGallery(false);
    loadData();
  }, [location]);

  useEffect(() => {
    if (locationData?.location) {
      loadTravelStats(locationData.location);
    }
  }, [locationData?.location]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [detailsRes, reviewsRes] = await Promise.allSettled([
        apiService.getLocationDetails(location),
        apiService.getLocationReviews(location, 300),
      ]);

      if (detailsRes.status === 'fulfilled') {
        setLocationData(detailsRes.value);
      } else {
        throw detailsRes.reason;
      }

      let loadedReviews = [];
      if (reviewsRes.status === 'fulfilled') {
        loadedReviews = reviewsRes.value || [];
      }

      // Retry with canonical backend location name if first lookup returned empty.
      if (loadedReviews.length === 0 && detailsRes.status === 'fulfilled') {
        const canonicalName = detailsRes.value?.location;
        if (canonicalName && canonicalName !== location) {
          try {
            const retryReviews = await apiService.getLocationReviews(canonicalName, 300);
            loadedReviews = retryReviews || [];
          } catch (e) {
            console.warn('Reviews retry failed:', e?.message || e);
          }
        }
      }

      // Final fallback so tab does not stay empty.
      if (loadedReviews.length === 0 && detailsRes.status === 'fulfilled') {
        loadedReviews = (detailsRes.value?.sampleReviews || []).map((r, idx) => ({
          reviewId: r.reviewId || `sample_${idx + 1}`,
          reviewText: r.reviewText || '',
          location: detailsRes.value?.location || location,
        }));
      }

      setReviews(loadedReviews);
    } catch (error) {
      console.error('Error loading location details:', error);
      Alert.alert('Error', 'Failed to load location details.');
    } finally {
      setLoading(false);
    }
  };

  const allImages = useMemo(() => locationData?.images || [], [locationData]);
  const gallerySourceImages = useMemo(
    () => (allImages.length > 1 ? allImages.slice(1) : allImages),
    [allImages]
  );
  const previewGallery = useMemo(
    () => gallerySourceImages.slice(0, PREVIEW_GALLERY_COUNT),
    [gallerySourceImages]
  );
  const galleryRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < gallerySourceImages.length; i += 4) {
      rows.push(gallerySourceImages.slice(i, i + 4));
    }
    return rows;
  }, [gallerySourceImages]);
  const ratingValue = ((locationData?.overallSentiment || 0) / 100 * 5).toFixed(1);
  const positivePct = locationData?.sentimentBreakdown?.positive ?? 0;
  const neutralPct = locationData?.sentimentBreakdown?.neutral ?? 0;
  const negativePct = locationData?.sentimentBreakdown?.negative ?? 0;
  const getReviewRating = (review, idx) => {
    const key = `${review?.reviewId || ''}${review?.reviewText || ''}${idx}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash % 16); // 0..15
    return 3.5 + normalized / 10; // 3.5..5.0
  };

  const isReviewSarcastic = (review) => {
    if (!review) return false;
    if (review.isSarcastic === true || review.isSarcastic === 'true') return true;
    if (review.sarcasm === true || review.sarcasm === 'true') return true;
    if (String(review.sentiment).toLowerCase() === 'sarcastic') return true;
    return false;
  };

  const { normalReviews, sarcasticReviews } = useMemo(() => {
    const normal = [];
    const sarcastic = [];
    reviews.forEach((r) => {
      if (isReviewSarcastic(r)) sarcastic.push(r);
      else normal.push(r);
    });
    return { normalReviews: normal, sarcasticReviews: sarcastic };
  }, [reviews]);

  const normalizeAspectLabel = (rawAspect) => {
    const key = String(rawAspect || '').trim().toLowerCase();
    if (key === 'location') return 'Accessibility';
    if (key === 'ammenities' || key === 'amenities' || key === 'amenity') return 'Accommodation';
    return rawAspect;
  };
  const shouldHideAspect = (rawAspect) => {
    const key = String(rawAspect || '').trim().toLowerCase();
    return key === 'value' || key === 'service';
  };
  const detailsAspects = (locationData?.aspects || [])
    .filter((aspect) => !shouldHideAspect(aspect?.aspect))
    .map((aspect) => ({ ...aspect, aspect: normalizeAspectLabel(aspect?.aspect) }))
    .map((aspect) => {
      const locKey = String(locationData?.location || '').toLowerCase();
      const aspectName = String(aspect?.aspect || '').toLowerCase();
      if (
        locKey.includes('dambulla') &&
        locKey.includes('cave') &&
        aspectName.includes('accessibility')
      ) {
        return { ...aspect, score: 30, rating: 1.5 }; // Hardcode exactly 1.5
      }
      return aspect;
    });

  const detailsTopAspects = (locationData?.topAspects || [])
    .filter((aspect) => !shouldHideAspect(aspect?.aspect))
    .map((aspect) => ({ ...aspect, aspect: normalizeAspectLabel(aspect?.aspect) }))
    .map((aspect) => {
      const locKey = String(locationData?.location || '').toLowerCase();
      const aspectName = String(aspect?.aspect || '').toLowerCase();
      if (
        locKey.includes('dambulla') &&
        locKey.includes('cave') &&
        aspectName.includes('accessibility')
      ) {
        return { ...aspect, score: 30, rating: 1.5 }; // Hardcode exactly 1.5
      }
      return aspect;
    });
  const getAspectImage = (aspectName, idx) => {
    const key = (aspectName || '').toLowerCase();
    const matched = Object.keys(ASPECT_IMAGE_BY_KEYWORD).find((k) => key.includes(k));
    if (matched) return ASPECT_IMAGE_BY_KEYWORD[matched];
    return 'https://img.icons8.com/color/192/place-marker--v1.png';
  };
  const getAspectRating = (aspect) => {
    if (aspect?.rating !== undefined) return aspect.rating;
    const num = Number(aspect?.score) || 0;
    const raw = Math.max(0, Math.min(5, num / 20));
    return Math.round(raw * 10) / 10;
  };
  const renderAspectStars = (rating) =>
    Array.from({ length: 5 }).map((_, idx) => {
      const starIndex = idx + 1;
      let iconName = 'star-outline';
      if (rating >= starIndex) iconName = 'star';
      else if (rating >= starIndex - 0.5) iconName = 'star-half';
      return <Ionicons key={`aspect-star-${idx}`} name={iconName} size={16} color="#f59e0b" />;
    });
  const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const formatSunset = (isoDateTime) => {
    if (!isoDateTime) return '--';
    const d = new Date(isoDateTime);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Hardcoded rich location data based on mockups
  const getLocationRichData = (name) => {
    const defaultData = {
      about: `${name} is one of Sri Lanka's popular travel destinations, known for scenery, culture, and unique visitor experiences. Perfect for all types of travelers.`,
      highlights: ['Scenic views and atmosphere', 'Local cultural experiences', 'Great for photography', 'Popular tourist destination'],
      thingsToDo: [`Explore the main attractions at ${name}`, `Take a guided tour of the area`, `Visit nearby cafes and restaurants`, `Buy local souvenirs`, `Enjoy the sunset views`],
      travelTips: ['Wear comfortable walking shoes', 'Carry water and stay hydrated', 'Best to visit early morning or late afternoon', 'Check weather before planning your trip'],
      gettingThere: `Easily accessible by local transport or taxi. Ask your hotel or a local guide for the best route to ${name}.`
    };

    const locationNameStr = (name || '').toLowerCase();

    if (locationNameStr.includes('ella') || locationNameStr.includes('nine arch') || locationNameStr.includes('adam')) {
      return {
        about: "Picturesque hill country town surrounded by tea plantations, waterfalls, and dramatic mountain views. Perfect for hiking and nature lovers.",
        highlights: ["Nine Arch Bridge", "Little Adam's Peak hike", "Ella Rock trek", "Tea plantation tours"],
        thingsToDo: ["Hike to Little Adam's Peak (easy 1-hour trek)", "Trek to Ella Rock for sunrise views", "Visit the iconic Nine Arch Bridge", "Tour a working tea plantation", "Zipline through tea estates"],
        travelTips: ["Take the scenic train from Kandy or Nuwara Eliya", "Book train tickets in advance", "Stay 2-3 days to explore properly", "Try local tea at a plantation"],
        gettingThere: "Scenic train journey from Kandy (7 hours) or Nuwara Eliya (3 hours). Most scenic train ride in Sri Lanka!"
      };
    }

    if (locationNameStr.includes('galle')) {
      return {
        about: "A UNESCO World Heritage site featuring a beautiful blend of European architectural styles and South Asian traditions within fortified walls.",
        highlights: ["Historic Dutch Fort", "Galle Lighthouse", "Cobblestone streets", "Boutique shops and cafes", "Ocean views from the ramparts"],
        thingsToDo: ["Walk along the fort ramparts at sunset", "Visit the iconic Galle Lighthouse", "Explore the Dutch Reformed Church", "Shop for unique jewelry and handicrafts", "Dine at a boutique cafe"],
        travelTips: ["Can get very hot midday, bring a hat and sunscreen", "Perfect for exploring on foot", "Stay inside the fort for the best experience", "Great cafes hidden in narrow streets"],
        gettingThere: "Accessible via the Southern Expressway from Colombo (about 2 hours) or by the scenic coastal railway."
      };
    }

    if (locationNameStr.includes('sigiriya')) {
      return {
        about: "An ancient palace and fortress complex carved into a massive column of rock. One of Sri Lanka's most dramatic and captivating historical sites.",
        highlights: ["Lion Rock Fortress", "Ancient frescoes", "Water Gardens", "Mirror Wall", "Panoramic summit views"],
        thingsToDo: ["Climb the 1,200 steps to the summit", "Admire the ancient Heavenly Maidens frescoes", "Explore the terraced water gardens", "Visit the Sigiriya Museum at the base", "Hike nearby Pidurangala Rock for sunset"],
        travelTips: ["Start the climb as early as 7 AM to avoid heat and crowds", "Bring plenty of water", "Wear comfortable climbing shoes", "Beware of wasp warnings on the rock"],
        gettingThere: "Located in the Cultural Triangle, about 4 hours drive from Colombo or accessible from Dambulla or Habarana hubs."
      };
    }

    return defaultData;
  };

  const getKnownCoordinates = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('temple of the sacred tooth')) return { latitude: 7.2936, longitude: 80.6415 };
    if (lower.includes('galle')) return { latitude: 6.0238, longitude: 80.2158 };
    if (lower.includes('sigiriya')) return { latitude: 7.9570, longitude: 80.7603 };
    if (lower.includes('ella') || lower.includes('nine arch') || lower.includes('adam')) return { latitude: 6.8667, longitude: 81.0466 };
    if (lower.includes('yala')) return { latitude: 6.3683, longitude: 81.5186 };
    if (lower.includes('mirissa')) return { latitude: 5.9483, longitude: 80.4571 };
    if (lower.includes('kandy')) return { latitude: 7.2906, longitude: 80.6337 };
    if (lower.includes('nuwara eliya')) return { latitude: 6.9497, longitude: 80.7828 };
    if (lower.includes('colombo')) return { latitude: 6.9271, longitude: 79.8612 };
    return null;
  };

  const loadTravelStats = async (destinationName) => {
    try {
      const Location = await import('expo-location');
      let currentPos = null;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        } catch (e) {
          console.warn('Could not get current location:', e);
        }
      }

      let dest = getKnownCoordinates(destinationName);

      if (!dest) {
        try {
          const destinationResults = await Location.geocodeAsync(`${destinationName}, Sri Lanka`);
          if (destinationResults?.length) {
            dest = destinationResults[0];
          }
        } catch (e) {
          console.warn('Geocoding failed:', e);
        }
      }

      if (!dest) {
        setTravelStats({ distanceKm: '--', weatherC: '--', sunset: '--' });
        return;
      }

      let distanceStr = '--';
      if (currentPos) {
        const dist = haversineDistanceKm(
          currentPos.coords.latitude,
          currentPos.coords.longitude,
          dest.latitude,
          dest.longitude
        );
        distanceStr = `${Math.round(dist)} Km`;
      }

      let weatherC = '--';
      let sunset = '--';
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${dest.latitude}&longitude=${dest.longitude}&current=temperature_2m&daily=sunset&timezone=auto&forecast_days=1`
        );
        if (weatherRes.ok) {
          const weatherJson = await weatherRes.json();
          const temp = weatherJson?.current?.temperature_2m;
          const sunsetIso = weatherJson?.daily?.sunset?.[0];
          if (typeof temp === 'number') weatherC = `${Math.round(temp)}\u00B0C`;
          sunset = formatSunset(sunsetIso);
        }
      } catch (error) {
        console.warn('Weather lookup failed:', error?.message || error);
      }

      setTravelStats({
        distanceKm: distanceStr,
        weatherC,
        sunset,
      });
    } catch (error) {
      console.warn('Travel stats lookup failed:', error?.message || error);
      setTravelStats({

        distanceKm: '--',
        weatherC: '--',
        sunset: '--',
      });
    }
  };
  const openInGoogleMaps = async () => {
    const query = encodeURIComponent(locationData?.location || location);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open Google Maps:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0c2340" />
          <Text style={styles.loadingText}>Loading location details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!locationData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>Location not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#0c2340" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{locationData.location}</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.heroWrap}>
          {allImages[0] ? (
            <View style={styles.heroImageContainer}>
              <Image source={{ uri: allImages[0] }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.imageTopRight}>
                <TouchableOpacity style={styles.favoriteIconBtn}>
                  <Ionicons name="heart-outline" size={15} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.imageBottomRight}>
                <TouchableOpacity style={styles.googleMapIconWrapper} onPress={openInGoogleMaps}>
                  <Image
                    source={{ uri: 'https://img.icons8.com/color/48/google-maps-new.png' }}
                    style={styles.realGoogleMapIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="image-outline" size={36} color="#9ca3af" />
            </View>
          )}
        </View>

        <View style={styles.statsCardWrap}>
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Distance</Text>
              <Text style={styles.statValue}>{travelStats.distanceKm}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Weather</Text>
              <Text style={styles.statValue}>{travelStats.weatherC}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Sunset</Text>
              <Text style={styles.statValue}>{travelStats.sunset}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.locationName}>{locationData.location}</Text>
            <View style={styles.ratingWrap}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>{ratingValue} reviews</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={13} color="#64748b" />
              <Text style={styles.metaText}>Sri Lanka</Text>
            </View>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'Overview' && styles.tabBtnActive]}
              onPress={() => setActiveTab('Overview')}
            >
              <Text style={[styles.tabText, activeTab === 'Overview' && styles.tabTextActive]}>Overview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'Details' && styles.tabBtnActive]}
              onPress={() => setActiveTab('Details')}
            >
              <Text style={[styles.tabText, activeTab === 'Details' && styles.tabTextActive]}>Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'Reviews' && styles.tabBtnActive]}
              onPress={() => setActiveTab('Reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'Reviews' && styles.tabTextActive]}>Reviews</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Overview' ? (
            <View>
              {/* About Section */}
              <View style={styles.richCard}>
                <Text style={styles.richCardTitle}>About This Destination</Text>
                <Text style={styles.overviewDesc}>{getLocationRichData(locationData.location).about}</Text>
              </View>

              {/* Highlights Section */}
              <View style={styles.richCard}>
                <View style={styles.richCardHeader}>
                  <View style={[styles.richIconWrap, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#d97706" />
                  </View>
                  <Text style={styles.richCardTitleLine}>Highlights</Text>
                </View>
                {getLocationRichData(locationData.location).highlights.map((item, idx) => (
                  <View key={`hl-${idx}`} style={styles.highlightRow}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
                    <Text style={styles.highlightText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Things to Do Section */}
              <View style={styles.richCard}>
                <View style={styles.richCardHeader}>
                  <View style={[styles.richIconWrap, { backgroundColor: '#e2e8f0' }]}>
                    <Ionicons name="compass-outline" size={18} color="#0f172a" />
                  </View>
                  <Text style={styles.richCardTitleLine}>Things to Do</Text>
                </View>
                {getLocationRichData(locationData.location).thingsToDo.map((item, idx) => (
                  <View key={`td-${idx}`} style={styles.todoRow}>
                    <View style={styles.todoNumberBadge}>
                      <Text style={styles.todoNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.todoText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Travel Tips Section */}
              <View style={styles.richCard}>
                <View style={styles.richCardHeader}>
                  <View style={[styles.richIconWrap, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="bulb-outline" size={18} color="#d97706" />
                  </View>
                  <Text style={styles.richCardTitleLine}>Travel Tips</Text>
                </View>
                {getLocationRichData(locationData.location).travelTips.map((item, idx) => (
                  <View key={`tp-${idx}`} style={styles.tipRow}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Getting There Section */}
              <View style={styles.richCard}>
                <View style={styles.richCardHeader}>
                  <View style={[styles.richIconWrap, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="bus-outline" size={18} color="#2563eb" />
                  </View>
                  <Text style={styles.richCardTitleLine}>Getting There</Text>
                </View>
                <Text style={styles.gettingThereText}>
                  {getLocationRichData(locationData.location).gettingThere}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtnOutline}>
                  <Text style={styles.actionBtnOutlineText}>Save for Later</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnSolid}>
                  <Text style={styles.actionBtnSolidText}>Plan Trip</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.galleryHeader}>
                <Text style={styles.sectionTitle}>Gallery</Text>
              </View>

              {gallerySourceImages.length > 0 ? (
                showAllGallery ? (
                  <View style={styles.galleryRowsWrap}>
                    {galleryRows.map((row, rowIdx) => (
                      <ScrollView
                        key={`gallery-row-${rowIdx}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryRow}
                      >
                        {row.map((img, idx) => (
                          <Image
                            key={`${img}-${rowIdx}-${idx}`}
                            source={{ uri: img }}
                            style={[
                              styles.galleryImageLarge,
                              { width: GALLERY_CARD_WIDTH, height: GALLERY_CARD_HEIGHT },
                            ]}
                          />
                        ))}
                      </ScrollView>
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryRow}
                  >
                    {previewGallery.map((img, idx) => (
                      <Image
                        key={`${img}-${idx}`}
                        source={{ uri: img }}
                        style={[styles.galleryImageLarge, { width: GALLERY_CARD_WIDTH, height: GALLERY_CARD_HEIGHT }]}
                      />
                    ))}
                  </ScrollView>
                )
              ) : (
                <Text style={styles.sectionText}>No gallery images available for this location.</Text>
              )}

              {!showAllGallery && gallerySourceImages.length > PREVIEW_GALLERY_COUNT && (
                <TouchableOpacity style={styles.showAllBtn} onPress={() => setShowAllGallery(true)}>
                  <Text style={styles.showAllText}>Show All</Text>
                </TouchableOpacity>
              )}

              {showAllGallery && gallerySourceImages.length > PREVIEW_GALLERY_COUNT && (
                <TouchableOpacity style={styles.showAllBtn} onPress={() => setShowAllGallery(false)}>
                  <Text style={styles.showAllText}>Show Less</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : activeTab === 'Details' ? (
            <View>
              <Text style={styles.aspectInsightsTitle}>Visitor Feedback Summary</Text>
              <View style={styles.sentimentCard}>
                <View style={styles.sentimentBarRow}>
                  <Text style={styles.sentimentBarLabel}>Positive</Text>
                  <View style={styles.sentimentTrack}>
                    <View style={[styles.sentimentFillPositive, { width: `${positivePct}%` }]} />
                  </View>
                  <Text style={[styles.sentimentBarPct, styles.sentimentLegendPositive]}>{positivePct}%</Text>
                </View>
                <View style={styles.sentimentBarRow}>
                  <Text style={styles.sentimentBarLabel}>Neutral</Text>
                  <View style={styles.sentimentTrack}>
                    <View style={[styles.sentimentFillNeutral, { width: `${neutralPct}%` }]} />
                  </View>
                  <Text style={[styles.sentimentBarPct, styles.sentimentLegendNeutral]}>{neutralPct}%</Text>
                </View>
                <View style={styles.sentimentBarRow}>
                  <Text style={styles.sentimentBarLabel}>Negative</Text>
                  <View style={styles.sentimentTrack}>
                    <View style={[styles.sentimentFillNegative, { width: `${negativePct}%` }]} />
                  </View>
                  <Text style={[styles.sentimentBarPct, styles.sentimentLegendNegative]}>{negativePct}%</Text>
                </View>
              </View>

              <Text style={styles.topRatedTitle}>Most Loved Features</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topAspectRow}
              >
                {detailsTopAspects.map((aspect, idx) => {
                  const asLowerCase = (aspect.aspect || '').toLowerCase();

                  // Compute CTA (Call to Action)
                  let buttonText = 'Explore Area';
                  let buttonIcon = 'compass-outline';
                  let onPressAction = openInGoogleMaps; // Fallback to explore the location
                  let subtitle = `Loved for ${aspect.aspect}`;

                  if (asLowerCase.includes('food') || asLowerCase.includes('dining')) {
                    buttonText = 'Find Restaurants';
                    buttonIcon = 'restaurant-outline';
                    subtitle = 'Amazing local cuisine';
                    onPressAction = async () => {
                      const query = encodeURIComponent(`restaurants near ${locationData.location}`);
                      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                    };
                  } else if (asLowerCase.includes('accommodation') || asLowerCase.includes('accomodation') || asLowerCase.includes('ammenities')) {
                    buttonText = 'View Hotels';
                    buttonIcon = 'bed-outline';
                    subtitle = 'Great places to stay';
                    onPressAction = () => {
                      navigation.navigate('HotelRecommendations', { location: locationData.location });
                    };
                  } else if (asLowerCase.includes('view') || asLowerCase.includes('scenery') || asLowerCase.includes('nature') || asLowerCase.includes('beach')) {
                    buttonText = 'See Gallery';
                    buttonIcon = 'images-outline';
                    subtitle = 'Beautiful beautiful scenery';
                    onPressAction = () => {
                      setActiveTab('Overview');
                    };
                  } else if (asLowerCase.includes('culture') || asLowerCase.includes('heritage') || asLowerCase.includes('history')) {
                    buttonText = 'Explore Sites';
                    buttonIcon = 'trail-sign-outline';
                    subtitle = 'Rich cultural heritage';
                    onPressAction = async () => {
                      const query = encodeURIComponent(`historical sites near ${locationData.location}`);
                      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                    };
                  } else if (asLowerCase.includes('transport') || asLowerCase.includes('accessibility')) {
                    buttonText = 'Transit Options';
                    buttonIcon = 'bus-outline';
                    subtitle = 'Easy to get around';
                    onPressAction = async () => {
                      const query = encodeURIComponent(`transit stations near ${locationData.location}`);
                      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                    };
                  }

                  return (
                    <View key={`${aspect.aspect}-${idx}`} style={styles.topAspectInteractiveCard}>
                      <View style={styles.topAspectInteractiveHeaderRow}>
                        <Image
                          source={{ uri: getAspectImage(aspect.aspect, idx) }}
                          style={styles.topAspectInteractiveImage}
                          resizeMode="contain"
                        />
                        <View style={styles.topAspectInteractiveScore}>
                          {renderAspectStars(getAspectRating(aspect))[0]}
                          <Text style={styles.topAspectInteractiveRatingValue}>{getAspectRating(aspect).toFixed(1)}</Text>
                        </View>
                      </View>

                      <View style={styles.topAspectInteractiveContent}>
                        <Text style={styles.topAspectInteractiveSubtitle} numberOfLines={1}>{subtitle}</Text>
                        <Text style={styles.topAspectInteractiveTitle} numberOfLines={1}>
                          {aspect.aspect}
                        </Text>
                      </View>

                      <TouchableOpacity style={styles.topAspectInteractiveBtn} onPress={onPressAction}>
                        <Ionicons name={buttonIcon} size={16} color="#ffffff" />
                        <Text style={styles.topAspectInteractiveBtnText}>{buttonText}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>

              <Text style={styles.aspectLevelTitle}>Detailed Ratings</Text>
              <View style={styles.aspectGridContainer}>
                {detailsAspects.map((aspect, idx) => {
                  const rating = getAspectRating(aspect);
                  // Calculate percentage for progress bar (0-100%)
                  const ratingPct = Math.max(0, Math.min(100, (rating / 5) * 100));

                  return (
                    <View key={`${aspect.aspect}-${idx}`} style={styles.modernAspectCard}>
                      <View style={styles.modernAspectHeaderRow}>
                        <Image
                          source={{ uri: getAspectImage(aspect.aspect, idx) }}
                          style={styles.modernAspectIcon}
                          resizeMode="contain"
                        />
                        <View style={styles.modernAspectScoreBadge}>
                          <Ionicons name="star" size={12} color="#f59e0b" />
                          <Text style={styles.modernAspectScoreText}>{rating.toFixed(1)}</Text>
                        </View>
                      </View>

                      <Text style={styles.modernAspectTitle} numberOfLines={1}>
                        {aspect.aspect}
                      </Text>

                      {/* Subtle progress bar instead of 5 stars */}
                      <View style={styles.modernAspectTrack}>
                        <View style={[styles.modernAspectFill, { width: `${ratingPct}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Reviews</Text>

              {sarcasticReviews.length > 0 && (
                <View style={styles.sarcasmBanner}>
                  <View style={styles.sarcasmBannerHeader}>
                    <Ionicons name="warning" size={20} color="#9a3412" />
                    <Text style={styles.sarcasmBannerTitle}>Sarcastic reviews detected</Text>
                  </View>
                  <Text style={styles.sarcasmBannerText}>
                    Some reviews for this location have been flagged as sarcastic or having a hidden meaning.
                  </Text>
                  <TouchableOpacity
                    style={styles.sarcasmToggleBtn}
                    onPress={() => setShowSarcastic(!showSarcastic)}
                  >
                    <Text style={styles.sarcasmToggleBtnText}>
                      {showSarcastic ? "Hide Sarcastic Reviews" : "View Sarcastic Reviews"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {(() => {
                const listToRender = showSarcastic ? sarcasticReviews : normalReviews;
                if (listToRender.length === 0) {
                  return <Text style={styles.sectionText}>No {showSarcastic ? 'sarcastic ' : ''}reviews found.</Text>;
                }
                return listToRender.map((review, idx) => (
                  <View
                    key={`${review.reviewId || idx}`}
                    style={[
                      styles.reviewCard,
                      showSarcastic ? styles.reviewCardSarcastic : (idx % 2 === 0 ? styles.reviewCardMint : styles.reviewCardBlue)
                    ]}
                  >
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={18} color="#ffffff" />
                      </View>
                      <View style={styles.reviewStarsRow}>
                        {Array.from({ length: 5 }).map((_, starIdx) => (
                          <Ionicons
                            key={`star-${starIdx}`}
                            name={starIdx < Math.round(getReviewRating(review, idx)) ? 'star' : 'star-outline'}
                            size={16}
                            color="#eab308"
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{review.reviewText}</Text>
                  </View>
                ));
              })()}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f6' },
  scroll: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#0c2340' },
  topBarSpacer: {
    width: 34,
    height: 34,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: { paddingHorizontal: 16 },
  heroImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: { width: '100%', height: 220, borderRadius: 18 },
  heroPlaceholder: { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  imageTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  imageBottomRight: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  favoriteIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMapIconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  realGoogleMapIcon: {
    width: 32,
    height: 32,
  },
  statsCardWrap: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    color: '#111827',
    fontWeight: '700',
  },
  infoCard: { margin: 16, marginTop: 14, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  locationName: { fontSize: 24, fontWeight: '700', color: '#1f2937', flex: 1, marginRight: 8 },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  ratingText: { color: '#14532d', fontWeight: '700', fontSize: 13 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20 },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde7b0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#0c2340' },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0c2340' },
  aspectInsightsTitle: { fontSize: 18, fontWeight: '700', color: '#0a1f44' },
  topRatedTitle: { fontSize: 18, fontWeight: '700', color: '#0a1f44', marginTop: 4, marginBottom: 12 },
  aspectLevelTitle: { fontSize: 18, fontWeight: '700', color: '#0a1f44', marginTop: 12, marginBottom: 14 },
  showAllText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  showAllBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  sectionText: { color: '#6b7280', lineHeight: 20, marginBottom: 10 },
  overviewDesc: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 4,
  },
  richCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0c2340',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  richCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2340',
    marginBottom: 10,
  },
  richCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  richIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  richCardTitleLine: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2340',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  highlightText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  todoNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0c2340', // Navy accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoNumberText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  todoText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  gettingThereText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  galleryRowsWrap: {
    gap: 10,
  },
  galleryRow: { paddingVertical: 4, paddingRight: 12, paddingLeft: 2 },
  galleryImageLarge: {
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  reviewCard: { borderRadius: 14, padding: 12, marginBottom: 10 },
  reviewCardMint: {
    backgroundColor: '#d8f5e8',
  },
  reviewCardBlue: {
    backgroundColor: '#d8eef8',
  },
  reviewCardSarcastic: {
    backgroundColor: '#ffedd5',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0ea5a6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewText: { color: '#334155', lineHeight: 22, fontSize: 16 },
  sentimentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  sentimentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sentimentValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c2340',
  },
  sentimentHint: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  sentimentTrack: {
    flex: 1,
    marginHorizontal: 10,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sentimentBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sentimentBarLabel: {
    width: 62,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  sentimentBarPct: {
    width: 42,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
  },
  sentimentFill: {
    height: '100%',
    borderRadius: 6,
  },
  sentimentFillPositive: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  sentimentFillNeutral: {
    height: '100%',
    backgroundColor: '#facc15',
  },
  sentimentFillNegative: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  sentimentLegendPositive: {
    color: '#10b981',
  },
  sentimentLegendNeutral: {
    color: '#6b7280',
  },
  sentimentLegendNegative: {
    color: '#ef4444',
  },
  aspectChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  topAspectRow: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  // Interactive Top Aspect Cards
  topAspectInteractiveCard: {
    width: 200,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  topAspectInteractiveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topAspectInteractiveImage: {
    width: 36,
    height: 36,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 6,
  },
  topAspectInteractiveScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topAspectInteractiveRatingValue: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: '800',
  },
  topAspectInteractiveContent: {
    marginBottom: 12,
  },
  topAspectInteractiveSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  topAspectInteractiveTitle: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  topAspectInteractiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#51a2f8ff', // Standard professional blue
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  topAspectInteractiveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  aspectChip: {
    backgroundColor: '#e8f5e9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  aspectChipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
  },
  aspectCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  aspectCardImage: {
    width: ASPECT_CARD_IMAGE_WIDTH,
    height: ASPECT_CARD_IMAGE_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    marginRight: 10,
  },
  aspectCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  aspectCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  aspectCardTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700',
    textTransform: 'capitalize',
    flex: 1,
    marginRight: 8,
  },
  aspectCardTag: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aspectCardTagText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  aspectStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
  },
  aspectRatingValue: {
    marginLeft: 8,
    fontSize: 28,
    color: '#0f172a',
    fontWeight: '800',
  },
  // New Aspect Grid Styles
  aspectGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  modernAspectCard: {
    width: '48%', // 2 columns with small gap
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  modernAspectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernAspectIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  modernAspectScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  modernAspectScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  modernAspectTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  modernAspectTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  modernAspectFill: {
    height: '100%',
    backgroundColor: '#10b981', // Teal/green color for progress
    borderRadius: 2,
  },
  // Sarcasm Banner Styles
  sarcasmBanner: {
    backgroundColor: '#ffedd5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  sarcasmBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  sarcasmBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9a3412',
  },
  sarcasmBannerText: {
    fontSize: 13,
    color: '#9a3412',
    marginBottom: 12,
    lineHeight: 18,
  },
  sarcasmToggleBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutlineText: {
    color: '#13254eff',
    fontWeight: '700',
    fontSize: 15,
  },
  actionBtnSolid: {
    flex: 1,
    backgroundColor: '#13254eff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSolidText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default LocationDetailModernScreen;
