import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

const LOCATIONS = [
  'All Locations',
  'Ahungalla, Galle District, Southern Province',
  'Anuradhapura, North Central Province',
  'Arugam Bay, Eastern Province',
  'Dambulla, Central Province',
  'Giritale, Polonnaruwa, North Central Province',
  'Hambantota, Tangalle, Southern Province',
  'Heerassagala, Kandy, Kandy District, Central Province',
  'Hikkaduwa, Galle District, Southern Province',
  'Kalutara, Western Province',
  'Kandy, Kandy District, Central Province',
  'Kochchikade, Negombo, Western Province',
  'Kudapaduwa, Negombo, Western Province',
  'Mirissa, Southern Province',
  'Negombo, Western Province',
  'Palatupana, Yala National Park',
  'Panadura, Western Province',
  'Polonnaruwa, North Central Province',
  'Pottuvil, Arugam Bay, Eastern Province',
  'Talpe, Galle District, Southern Province',
  'Trincomalee, Eastern Province',
  'Wadduwa, Western Province',
  'Yala National Park',
];

const RATINGS = ['Any Rating', '3+', '4+', '4.5+'];

const AMENITIES = [
  { id: 'pool', label: 'Pool', icon: 'water' },
  { id: 'beach', label: 'Beach Access', icon: 'beach' },
  { id: 'spa', label: 'Spa', icon: 'flower' },
  { id: 'garden', label: 'Garden', icon: 'leaf' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { id: 'parking', label: 'Parking', icon: 'car' },
  { id: 'gym', label: 'Gym', icon: 'fitness' },
];

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [location, setLocation] = useState('All Locations');
  const [rating, setRating] = useState('Any Rating');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showRatingPicker, setShowRatingPicker] = useState(false);

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      setSelectedAmenities(selectedAmenities.filter((id) => id !== amenityId));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    }
  };

  const handleGetRecommendations = () => {
    router.push({
      pathname: '/(tabs)/recommendations',
      params: {
        location: location !== 'All Locations' ? location : '',
        rating: rating !== 'Any Rating' ? rating : '',
        amenities: selectedAmenities.join(','),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="location" size={32} color="#10b981" />
            <Text style={styles.logoText}>AccommoBuddy</Text>
          </View>
          <Text style={styles.tagline}>AI-Powered Recommendations</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Discover Your{' '}
            <Text style={styles.heroTitleAccent}>Perfect Stay</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Powered by AI to recommend the best accommodations based on your preferences and Sri Lankan hospitality insights
          </Text>
        </View>

        {/* Search Card */}
        <View style={styles.searchCard}>
          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Where would you like to stay?</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowLocationPicker(!showLocationPicker)}
            >
              <Ionicons name="location-outline" size={20} color="#10b981" />
              <Text style={styles.pickerText}>{location}</Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showLocationPicker && (
              <View style={styles.pickerOptions}>
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={styles.pickerOption}
                    onPress={() => {
                      setLocation(loc);
                      setShowLocationPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Rating */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimum Rating</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowRatingPicker(!showRatingPicker)}
            >
              <Ionicons name="star-outline" size={20} color="#10b981" />
              <Text style={styles.pickerText}>{rating}</Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showRatingPicker && (
              <View style={styles.pickerOptions}>
                {RATINGS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={styles.pickerOption}
                    onPress={() => {
                      setRating(r);
                      setShowRatingPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Amenities */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {AMENITIES.map((amenity) => (
                <TouchableOpacity
                  key={amenity.id}
                  style={[
                    styles.amenityChip,
                    selectedAmenities.includes(amenity.id) && styles.amenityChipActive,
                  ]}
                  onPress={() => toggleAmenity(amenity.id)}
                >
                  <Ionicons
                    name={amenity.icon as any}
                    size={18}
                    color={selectedAmenities.includes(amenity.id) ? '#10b981' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.amenityChipText,
                      selectedAmenities.includes(amenity.id) && styles.amenityChipTextActive,
                    ]}
                  >
                    {amenity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Get Recommendations Button */}
          <TouchableOpacity
            style={styles.recommendButton}
            onPress={handleGetRecommendations}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.recommendButtonText}>Get Recommendations</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tagline: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  heroTitleAccent: {
    color: '#10b981',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  searchCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerOptions: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amenityChipActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  amenityChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  amenityChipTextActive: {
    color: '#10b981',
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    marginTop: 8,
  },
  recommendButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
