import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Hotel } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getHotelImageUrl, getPlaceholderImage } from '@/utils/imageUtils';

interface Suggestion {
  type: string;
  text: string;
  location?: string;
  hotel_id?: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load suggestions as user types
  useEffect(() => {
    const loadSuggestions = async () => {
      if (query.trim().length >= 2) {
        try {
          const data = await api.getSearchSuggestions(query, 8);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error loading suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(loadSuggestions, 300); // Debounce for 300ms
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setShowSuggestions(false); // Hide suggestions when searching
    try {
      const data = await api.searchHotels(query, token || undefined);
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    // Auto-search when suggestion is selected
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // Separate component for search result to use hooks
  const SearchResultCard = ({ item, onPress }: { item: Hotel; onPress: () => void }) => {
    const [imageUrl, setImageUrl] = useState<string>(getPlaceholderImage());

    useEffect(() => {
      const loadImageUrl = async () => {
        if (item.image_url) {
          setImageUrl(item.image_url);
          return;
        }

        try {
          const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.8.178:8000';
          // Use proxy endpoint directly for better React Native compatibility
          const imageUrl = `${API_BASE_URL}/api/hotel-images/${item.hotel_id}/proxy?index=1`;
          setImageUrl(imageUrl);
        } catch (error) {
          console.error('Error loading image URL:', error);
        }
      };

      loadImageUrl();
    }, [item.hotel_id, item.image_url]);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Hotel image thumbnail */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.resultImage}
          resizeMode="cover"
          defaultSource={{ uri: getPlaceholderImage() }}
          onError={() => setImageUrl(getPlaceholderImage())}
        />

        {/* Hotel info */}
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.resultLocation}>
            <Ionicons name="location-outline" size={13} color="#6b7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          {/* Stars + rating + review count */}
          <View style={styles.resultRatingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(item.rating) ? 'star' : 'star-outline'}
                size={12}
                color="#f59e0b"
              />
            ))}
            <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
            {item.total_reviews != null && (
              <Text style={styles.reviewCount}>({item.total_reviews} reviews)</Text>
            )}
          </View>

          {/* View details CTA */}
          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#10b981" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  const renderResult = ({ item }: { item: Hotel }) => (
    <SearchResultCard
      item={item}
      onPress={() => router.push(`/hotel/${item.hotel_id}`)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search hotels or locations..."
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setSearched(false);
              }}
              onFocus={() => {
                if (query.length >= 2 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor="#9ca3af"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => {
                setQuery('');
                setResults([]);
                setSearched(false);
                setSuggestions([]);
                setShowSuggestions(false);
              }}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Ionicons
                  name={suggestion.type === 'hotel' ? 'bed' : 'location'}
                  size={18}
                  color="#6b7280"
                />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  {suggestion.location && suggestion.type === 'hotel' && (
                    <Text style={styles.suggestionLocation}>{suggestion.location}</Text>
                  )}
                </View>
                <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : searched ? (
          results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try different keywords</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="compass-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Start exploring</Text>
            <Text style={styles.emptySubtext}>Search for hotels or locations</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // Shadow properties for native platforms
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    // boxShadow for web (react-native-web)
    boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#d1fae5',
  },
  resultInfo: {
    flex: 1,
    marginRight: 16,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  resultStats: {
    justifyContent: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
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
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    // Shadow properties for native platforms
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    // boxShadow for web (react-native-web)
    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.1)',
    maxHeight: 300,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  suggestionLocation: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  resultRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 2,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
});

