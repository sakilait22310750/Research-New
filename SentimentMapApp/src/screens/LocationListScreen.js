import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Searchbar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiService from '../services/apiService';
import ImprovedLocationCard from '../components/ImprovedLocationCard';

const LocationListScreen = ({ navigation }) => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('sentiment'); // sentiment, name, sarcasm

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    filterAndSortLocations();
  }, [searchQuery, sortBy, locations]);

  const loadLocations = async () => {
    try {
      const locationData = await apiService.getLocationData();
      setLocations(locationData);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const filterAndSortLocations = () => {
    let filtered = locations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(loc =>
        loc.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'sentiment':
          return b.overallSentiment - a.overallSentiment;
        case 'name':
          return a.location.localeCompare(b.location);
        case 'sarcasm':
          return a.sarcasmRate - b.sarcasmRate;
        default:
          return 0;
      }
    });

    setFilteredLocations(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLocations();
    setRefreshing(false);
  };

  const SortButton = ({ label, value }) => (
    <Button
      mode={sortBy === value ? 'contained' : 'outlined'}
      onPress={() => setSortBy(value)}
      compact
      style={styles.sortButton}
    >
      {label}
    </Button>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Locations</Text>
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search locations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.sortSection}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <SortButton label="Sentiment" value="sentiment" />
          <SortButton label="Name" value="name" />
          <SortButton label="Sarcasm" value="sarcasm" />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLocations.map((location) => (
          <ImprovedLocationCard
            key={location.location}
            location={location}
            onPress={() => navigation.navigate('LocationDetail', { location: location.location })}
          />
        ))}

        {filteredLocations.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No locations found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    elevation: 1,
  },
  sortSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default LocationListScreen;
