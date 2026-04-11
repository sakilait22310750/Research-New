import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ImprovedLocationCard = ({ location, onPress }) => {
  const getTrendIcon = (trend) => {
    return trend === 'up' ? '📈' : '➡️';
  };

  const getBudgetLevel = (sentiment) => {
    if (sentiment >= 80) return '$$$';
    if (sentiment >= 60) return '$$';
    return '$';
  };

  return (
    <Pressable onPress={onPress} style={styles.cardContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.locationName}>{location.location}</Text>
              <Text style={styles.locationDetail}>Sri Lanka</Text>
            </View>
            <View style={styles.sentimentDisplay}>
              <Text style={styles.sentimentScore}>{location.overallSentiment}%</Text>
              <Ionicons name="thumbs-up" size={16} color="#eab308" />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {location.overallSentiment >= 60 ? '👍' : '👎'}
              </Text>
              <Text style={styles.statLabel}>
                {location.overallSentiment >= 60 ? 'Positive' : 'Negative'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getBudgetLevel(location.overallSentiment)}</Text>
              <Text style={styles.statLabel}>Budget</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{location.overallSentiment}%</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getTrendIcon(location.trend)}</Text>
              <Text style={styles.statLabel}>Trend</Text>
            </View>
          </View>

          <View style={styles.sentimentBar}>
            <View 
              style={[
                styles.sentimentFill, 
                { 
                  width: `${location.overallSentiment}%`,
                  backgroundColor: location.overallSentiment >= 60 ? '#10b981' : '#f97316'
                }
              ]} 
            />
          </View>

          <Text style={styles.reviewsText}>
            {Math.floor(Math.random() * 5000 + 1000)} reviews
          </Text>
        </Card.Content>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    elevation: 2,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  locationDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  sentimentDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sentimentScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sentimentBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sentimentFill: {
    height: '100%',
    borderRadius: 3,
  },
  reviewsText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ImprovedLocationCard;
