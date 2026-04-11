import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';
import RecommendationCard from '../components/RecommendationCard';

const RecommendationsScreen = ({ navigation }) => {
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Traveler');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocationLabel, setCurrentLocationLabel] = useState('Locating...');
  const culturalLocations = [
    'Temple of Sacred Tooth Relic',
    'Polonnaruwa',
    'Jaya Sri Maha Bodhi',
    'Dambulla Cave Temple',
    'Sigiriya',
  ];

  // Get user name from global state
  useEffect(() => {
    if (global.userName) {
      setUserName(global.userName);
    }
  }, []);

  useEffect(() => {
    const loadCurrentLocation = async () => {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setCurrentLocationLabel('Location off');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const place = places?.[0];
        const label =
          place?.city ||
          place?.district ||
          place?.subregion ||
          place?.region ||
          place?.country ||
          'Unknown';

        setCurrentLocationLabel(label);
      } catch (error) {
        console.error('Error getting current location:', error);
        setCurrentLocationLabel('Location unavailable');
      }
    };

    loadCurrentLocation();
  }, []);

  const categories = [
    { id: 'all', label: 'All', icon: '🌍' },
    { id: 'beach', label: 'Beach', icon: '🏖️' },
    { id: 'cultural', label: 'Cultural', icon: '🏛️' },
    { id: 'parks', label: 'Nature', icon: '🌿' },
  ];

  useEffect(() => {
    loadRecommendations();
  }, []);

  // Filter recommendations when category changes
  useEffect(() => {
    filterRecommendations();
  }, [selectedCategory, allRecommendations, searchQuery]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      // Load full locations list (not top-10 recommendations) so category tabs can show all DB items
      const data = await apiService.getLocationData();
      const normalized = (data || []).map((loc) => ({
        ...loc,
        images: loc.thumbnail ? [loc.thumbnail] : (loc.images || []),
      }));

      console.log('[Recommendations] Loaded locations:', normalized.length);
      setAllRecommendations(normalized);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecommendations = () => {
    console.log('[Recommendations] Filtering - Category:', selectedCategory);
    console.log('[Recommendations] Total recommendations:', allRecommendations.length);

    let filtered = [];

    if (selectedCategory === 'all') {
      filtered = [...allRecommendations];
    } else {

      switch (selectedCategory) {
        case 'beach':
          filtered = allRecommendations.filter((loc) => {
            const type = (loc.locationType || '').toLowerCase();
            const name = (loc.location || '').toLowerCase();
            return type.includes('beach') || /beach|bay|coast|shore|sea/.test(name);
          });
          break;
        case 'cultural':
          filtered = allRecommendations.filter((loc) => {
            const locationName = (loc.location || '').toLowerCase();
            const culturalKeywords = [
              ['sacred', 'tooth'],
              ['dalada'],
              ['polonnaruwa'],
              ['jaya', 'sri', 'maha', 'bodhi'],
              ['maha', 'bodhi'],
              ['dambulla', 'cave'],
              ['sigiriya'],
            ];

            const inTargetList = culturalLocations.some((name) =>
              locationName.includes(name.toLowerCase())
            );

            const keywordMatch = culturalKeywords.some((group) =>
              group.every((k) => locationName.includes(k))
            );

            return inTargetList || keywordMatch;
          });
          break;
        case 'parks':
          filtered = allRecommendations.filter((loc) => {
            const type = (loc.locationType || '').toLowerCase();
            const name = (loc.location || '').toLowerCase();
            return type.includes('park') || /park|garden|reserve|sanctuary|national park/.test(name);
          });
          break;
        default:
          filtered = [...allRecommendations];
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(loc => (loc.location || '').toLowerCase().includes(q));
    }

    filtered = filtered.sort((a, b) => b.overallSentiment - a.overallSentiment);

    console.log('[Recommendations] Filtered results:', filtered.length);
    if (filtered.length > 0) {
      console.log('[Recommendations] Sample filtered scores:',
        filtered.slice(0, 3).map(l => `${l.location}: ${l.overallSentiment}`));
    }

    setFilteredRecommendations(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userName) return 'T';
    const names = userName.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient background */}
        <View style={styles.header}>
          {/* Top row: Location and notification */}
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.locationSelector}>
              <Ionicons name="location-outline" size={16} color="#fff" />
              <Text style={styles.locationText}>Sri Lanka</Text>
            </TouchableOpacity>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* User info row */}
          <View style={styles.userInfoRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Hi, {userName}!</Text>
              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Ionicons name="location" size={14} color="#fff" />
                  <Text style={styles.statText}>{currentLocationLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Recommendations Section - Vertical List */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.heroTitle}>Where Do{'\n'}You Want To Go?</Text>

          <View style={styles.searchBar}>
            <Ionicons name="location-outline" size={15} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Sri Lanka | Search destination"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
            <Ionicons name="search-outline" size={17} color="#9ca3af" />
          </View>

          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LocationList')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollView}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading recommendations...</Text>
            </View>
          ) : filteredRecommendations.length > 0 ? (
            <View style={styles.verticalList}>
              {filteredRecommendations.map((location, index) => (
                <RecommendationCard
                  key={location.location || index}
                  location={location}
                  onPress={() => navigation.navigate('LocationDetail', { location: location.location })}
                  horizontal={false}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedCategory === 'all'
                  ? 'No recommendations available'
                  : `No ${categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} recommendations found`}
              </Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={styles.resetButtonText}>View All Locations</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eceff1',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0c2340',
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    position: 'relative',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f4d36',
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '700',
    color: '#0c2340',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchBar: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  categoryTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0c2340',
    marginBottom: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryScrollView: {
    marginTop: 0,
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#fff9ed',
    borderWidth: 1,
    borderColor: '#f6c266',
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryLabel: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: '#1f4d36',
  },
  recommendationsSection: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2340',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  verticalList: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RecommendationsScreen;
