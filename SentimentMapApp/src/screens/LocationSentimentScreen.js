import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip } from 'react-native-paper';
import ImprovedSentimentDisplay from '../components/ImprovedSentimentDisplay';

const LocationSentimentScreen = ({ route }) => {
  const { locationData } = route.params || {};

  if (!locationData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>No sentiment data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Overall Sentiment Analysis</Text>
            <ImprovedSentimentDisplay score={locationData.overallSentiment} showBreakdown />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Detailed Aspect Analysis</Text>
            {(locationData.aspects || []).map((aspect, index) => (
              <View key={`${aspect.aspect}-${index}`} style={styles.aspectItem}>
                <Text style={styles.aspectName}>
                  {aspect.aspect?.charAt(0).toUpperCase() + aspect.aspect?.slice(1)}
                </Text>
                <ImprovedSentimentDisplay score={aspect.score} compact />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Top Rated Aspects</Text>
            <View style={styles.chipsRow}>
              {(locationData.topAspects || []).map((aspect, index) => (
                <Chip key={`${aspect.aspect}-${index}`} style={styles.chip}>
                  {aspect.aspect} ({aspect.score}%)
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#0c2340',
  },
  aspectItem: {
    marginBottom: 10,
  },
  aspectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default LocationSentimentScreen;
