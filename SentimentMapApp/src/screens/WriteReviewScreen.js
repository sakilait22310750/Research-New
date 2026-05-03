/**
 * WriteReviewScreen.js
 *
 * A 3-step review submission wizard, styled to match the reference design mockups.
 *
 * Step 1  – Overall star rating + "I recommend" toggle + aspect scale ratings
 * Step 2  – Review text body + title + optional photo upload (up to 5)
 * Step 3  – Thank-you confirmation with uploaded photo thumbnails
 *
 * Usage:
 *   navigation.navigate('WriteReview', { locationName: 'Galle Fort' })
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../services/apiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// App theme colours
const BRAND_GREEN = '#3d9e8c';  // kept for subtle accents (recommend toggle, photo picker)
const BRAND_NAVY = '#0c2340';  // primary navy
const STAR_COLOR = '#f59e0b';  // amber-yellow for star ratings

// ─── Helpers ────────────────────────────────────────────────────────────────

const RATING_LABELS = ['', 'Bad', 'So so', 'Good', 'Great', 'Amazing'];
const OVERALL_MSG = [
  '',
  "That's a tough visit. We'd love to know what went wrong.",
  'Every experience can teach us something.',
  'Glad you had a decent visit!',
  "Great 4 star! You're loving it.",
  "Great 5 star! Can't get any better than that!",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Tappable 5-star row */
const StarRating = ({ value, onChange, size = 40, color = STAR_COLOR }) => (
  <View style={starStyles.row}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
        <Ionicons
          name={value >= star ? 'star' : 'star-outline'}
          size={size}
          color={value >= star ? color : '#d1d5db'}
          style={{ marginHorizontal: 4 }}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

/** Numbered 1-5 scale selector (matches reference "Ease of access / Facilities" row) */
const ScaleSelector = ({ label, value, onChange }) => (
  <View style={scaleStyles.wrap}>
    <Text style={scaleStyles.label}>{label}</Text>
    <View style={scaleStyles.scaleRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          style={[scaleStyles.dot, value === n && scaleStyles.dotActive]}
          onPress={() => onChange(n)}
          activeOpacity={0.8}
        >
          <Text style={[scaleStyles.dotText, value === n && scaleStyles.dotTextActive]}>
            {n}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    <View style={scaleStyles.labelRow}>
      {RATING_LABELS.slice(1).map((l) => (
        <Text key={l} style={scaleStyles.scaleLabelText}>{l}</Text>
      ))}
    </View>
  </View>
);

const scaleStyles = StyleSheet.create({
  wrap: { marginBottom: 22 },
  label: { fontSize: 15, fontWeight: '700', color: BRAND_NAVY, marginBottom: 10 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  dotActive: { backgroundColor: STAR_COLOR, borderColor: STAR_COLOR },
  dotText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  dotTextActive: { color: '#ffffff' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleLabelText: { fontSize: 11, color: '#9ca3af', width: 50, textAlign: 'center' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

const WriteReviewScreen = ({ route, navigation }) => {
  const { locationName } = route.params || {};

  // Step control
  const [step, setStep] = useState(1); // 1 | 2 | 3

  // Step 1 state
  const [overallRating, setOverallRating] = useState(0);
  const [recommends, setRecommends] = useState(false);
  const [easeOfAccess, setEaseOfAccess] = useState(3);
  const [facilities, setFacilities] = useState(3);

  // Step 2 state
  const [reviewText, setReviewText] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [photos, setPhotos] = useState([]); // array of { uri, name, type }

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(null);

  // ── Photo picker ──────────────────────────────────────────────────────────

  const pickPhotos = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit reached', 'You can upload up to 5 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5 - photos.length,
    });

    if (!result.canceled && result.assets?.length) {
      const newPhotos = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName || `photo_${Date.now()}.jpg`,
        type: a.mimeType || 'image/jpeg',
      }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Review required', 'Please write your review before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiService.submitUserReview(locationName, {
        reviewerName: 'Traveller',
        overallRating: overallRating || 5,
        recommends: recommends,
        easeOfAccess: easeOfAccess,
        facilities: facilities,
        reviewTitle: reviewTitle,
        reviewText: reviewText,
        photos: photos,
      });
      setSubmittedReview(result);
      setStep(3);
    } catch (err) {
      Alert.alert('Submission failed', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Navigation guards ─────────────────────────────────────────────────────

  const goNext1 = () => {
    if (overallRating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before continuing.');
      return;
    }
    setStep(2);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header Container (navy, rounded bottom corners) ── */}
      <View style={styles.headerContainer}>
        {/* Title row */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews and Ratings</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Location chip — white card inside navy header */}
        <View style={styles.locationChip}>
          <View style={styles.locationChipAvatar}>
            <Ionicons name="location" size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.locationChipName}>{locationName}</Text>
            <Text style={styles.locationChipSub}>Sri Lanka</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ════════════════════════════════════════
              STEP 1 — Rating + Aspects
          ════════════════════════════════════════ */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>How was the trip?</Text>

              {/* Overall stars */}
              <StarRating value={overallRating} onChange={setOverallRating} size={44} />
              {overallRating > 0 && (
                <Text style={styles.ratingMsg}>{OVERALL_MSG[overallRating]}</Text>
              )}

              {/* Recommend toggle */}
              <TouchableOpacity
                style={[styles.recommendRow, recommends && styles.recommendRowActive]}
                onPress={() => setRecommends((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.recommendCheck, recommends && styles.recommendCheckActive]}>
                  <Ionicons
                    name={recommends ? 'checkmark' : 'checkmark-outline'}
                    size={16}
                    color={recommends ? '#ffffff' : '#9ca3af'}
                  />
                </View>
                <Text style={[styles.recommendText, recommends && styles.recommendTextActive]}>
                  I recommend this attraction
                </Text>
              </TouchableOpacity>

              {/* Aspect scales */}
              <Text style={styles.aspectSectionTitle}>
                How would you rate the following aspects?
              </Text>
              <ScaleSelector label="Ease of access" value={easeOfAccess} onChange={setEaseOfAccess} />
              <ScaleSelector label="Facilities" value={facilities} onChange={setFacilities} />

              {/* CTA */}
              <TouchableOpacity style={styles.primaryBtn} onPress={goNext1} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Share More Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ════════════════════════════════════════
              STEP 2 — Review text + Photos
          ════════════════════════════════════════ */}
          {step === 2 && (
            <View>
              {/* Perfect-score callout */}
              {overallRating === 5 && (
                <View style={styles.calloutBox}>
                  <Ionicons name="star" size={18} color={STAR_COLOR} />
                  <Text style={styles.calloutText}>
                    You gave it a perfect score. We'd love to hear more about your experience.
                  </Text>
                </View>
              )}

              {/* Review body */}
              <Text style={styles.inputLabel}>Write your review</Text>
              <TextInput
                style={[styles.textArea]}
                placeholder="Review"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={5}
                value={reviewText}
                onChangeText={setReviewText}
                maxLength={1500}
              />

              {/* Title */}
              <Text style={styles.inputLabel}>Summarize your visit in a few words</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Title"
                placeholderTextColor="#9ca3af"
                value={reviewTitle}
                onChangeText={setReviewTitle}
                maxLength={150}
              />

              {/* Photo upload */}
              <Text style={styles.inputLabel}>Share some photos of your visit</Text>
              <View style={styles.photosRow}>
                {photos.map((p, idx) => (
                  <View key={idx} style={styles.photoThumb}>
                    <Image source={{ uri: p.uri }} style={styles.photoThumbImg} />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removePhoto(idx)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                    <Text style={styles.photoName} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </View>
                ))}

                {photos.length < 5 && (
                  <TouchableOpacity
                    style={styles.addPhotoBtn}
                    onPress={pickPhotos}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={28} color={BRAND_GREEN} />
                    <Text style={styles.addPhotoText}>Add photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Submit your Review</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ════════════════════════════════════════
              STEP 3 — Thank you
          ════════════════════════════════════════ */}
          {step === 3 && (
            <View style={styles.thankYouWrap}>
              {/* Stars */}
              <View style={styles.thankYouStarRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= (submittedReview?.overallRating || overallRating) ? 'star' : 'star-outline'}
                    size={36}
                    color={s <= (submittedReview?.overallRating || overallRating) ? STAR_COLOR : '#d1d5db'}
                    style={{ marginHorizontal: 10, marginVertical: 30 }}
                  />
                ))}
              </View>

              <Ionicons name="star" size={60} color={STAR_COLOR} style={{ marginVertical: 50 }} />

              <Text style={styles.thankYouTitle}>Thank you for your review!</Text>
              <Text style={styles.thankYouSub}>
                You help fellow travellers find what's good out there in discovering the best
                experiences.
              </Text>

              {/* Uploaded photo previews */}
              {photos.length > 0 && (
                <View style={styles.thankYouPhotosRow}>
                  {photos.map((p, idx) => (
                    <View key={idx} style={styles.thankYouPhotoCard}>
                      <Image source={{ uri: p.uri }} style={styles.thankYouPhotoImg} />
                      <Text style={styles.thankYouPhotoName} numberOfLines={1}>
                        {p.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 28, alignSelf: 'stretch' }]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>See All your Reviews</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },

  // Header container — navy pill with rounded bottom, wraps title + location chip
  headerContainer: {
    backgroundColor: BRAND_NAVY,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },

  // Header title row (sits inside headerContainer, no own background)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // Location chip — white floating card inside the navy header
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  locationChipAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationChipName: { fontSize: 15, fontWeight: '700', color: BRAND_NAVY },
  locationChipSub: { fontSize: 12, color: '#64748b' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Step 1
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND_NAVY,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  ratingMsg: {
    textAlign: 'center',
    fontSize: 14,
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  recommendRowActive: {
    backgroundColor: '#fffbeb',
    borderColor: STAR_COLOR,
  },
  recommendCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  recommendCheckActive: {
    backgroundColor: STAR_COLOR,
    borderColor: STAR_COLOR,
  },
  recommendText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  recommendTextActive: { color: BRAND_NAVY, fontWeight: '700' },

  aspectSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_NAVY,
    marginTop: 22,
    marginBottom: 18,
  },

  // Step 2
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  calloutText: {
    flex: 1,
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_NAVY,
    marginBottom: 8,
    marginTop: 20,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 130,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
    marginBottom: 18,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fafafa',
    marginBottom: 22,
  },

  // Photo grid
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  photoThumb: {
    width: 90,
    alignItems: 'center',
  },
  photoThumbImg: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  photoName: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    width: 82,
    textAlign: 'center',
  },
  addPhotoBtn: {
    width: 82,
    height: 82,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BRAND_GREEN,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf9',
  },
  addPhotoText: {
    fontSize: 11,
    color: BRAND_GREEN,
    fontWeight: '600',
    marginTop: 2,
  },

  // Primary button — navy blue
  primaryBtn: {
    backgroundColor: BRAND_NAVY,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Step 3 — Thank you
  thankYouWrap: {
    alignItems: 'center',
    paddingTop: 10,
  },
  thankYouStarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  thankYouTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND_NAVY,
    textAlign: 'center',
    marginBottom: 12,
  },
  thankYouSub: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  thankYouPhotosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  thankYouPhotoCard: {
    alignItems: 'center',
    width: 88,
  },
  thankYouPhotoImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  thankYouPhotoName: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    width: 80,
    textAlign: 'center',
  },
});

export default WriteReviewScreen;
