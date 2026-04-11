import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from 'react-native-paper';

const SentimentBar = ({ score, label, showPercentage = true, height = 8 }) => {
  const getColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#84cc16'; // Lime
    if (score >= 40) return '#eab308'; // Yellow
    if (score >= 20) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const color = getColor(score);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.barContainer}>
        <ProgressBar
          progress={score / 100}
          color={color}
          style={[styles.progressBar, { height }]}
        />
        {showPercentage && (
          <Text style={[styles.percentage, { color }]}>
            {score}%
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#374151',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 35,
  },
});

export default SentimentBar;
