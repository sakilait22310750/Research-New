import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ImprovedSentimentDisplay = ({ score, showBreakdown = false, compact = false }) => {
  const getSentimentColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#eab308';
    if (score >= 20) return '#f97316';
    return '#ef4444';
  };

  const getSentimentIcon = (score) => {
    if (score >= 60) return 'thumbs-up';
    if (score >= 40) return 'remove';
    return 'thumbs-down';
  };

  const sentimentColor = getSentimentColor(score);
  const positivePercentage = Math.round(score * 0.91);
  const neutralPercentage = Math.round(score * 0.03);
  const negativePercentage = Math.round(score * 0.06);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={[styles.score, { color: sentimentColor }]}>{score}%</Text>
        <Ionicons name={getSentimentIcon(score)} size={16} color={sentimentColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.score, { color: sentimentColor }]}>{score}%</Text>
        <Ionicons name={getSentimentIcon(score)} size={20} color={sentimentColor} />
      </View>
      
      {showBreakdown && (
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <Ionicons name="thumbs-up" size={14} color="#10b981" />
            <Text style={styles.breakdownText}>{positivePercentage}%</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="remove" size={14} color="#6b7280" />
            <Text style={styles.breakdownText}>{neutralPercentage}%</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="thumbs-down" size={14} color="#ef4444" />
            <Text style={styles.breakdownText}>{negativePercentage}%</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  breakdown: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ImprovedSentimentDisplay;
