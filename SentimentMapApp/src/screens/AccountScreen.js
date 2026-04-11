import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clearStoredAuth } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';

const PROFILE_KEY = '@sentimentmap_profile';

// ─── Static profile data ──────────────────────────────────────────────────────
// Email is read dynamically from global state (set at login/restore) — see useState below

const DESTINATIONS = ['Galle', 'Kandy', 'Colombo', 'Dambulla', 'Passikudah', 'Negombo', 'Ella', 'Nuwara Eliya'];
const RATINGS = ['3+', '3.5+', '4+', '4.5+', '5+'];
const AMENITIES = ['Pool', 'Beach Access', 'Spa', 'WiFi', 'Gym', 'Restaurant', 'Bar', 'Parking', 'Mountain View'];
const DEFAULT_PREFS = { destinations: [], rating: null, minBudget: 50, maxBudget: 200, amenities: [] };

const AI_TRAITS = [
  { emoji: '🏖️', label: 'Beach & Ocean lover' },
  { emoji: '🏨', label: 'Prefers upscale properties' },
  { emoji: '🧖', label: 'Spa & wellness seeker' },
  { emoji: '🌍', label: 'Cultural explorer' },
];

const BOOKING_HISTORY = [
  { hotel: 'Heritance Ahungalla', dates: 'Jan 15–18, 2025 · 3 nights', price: '$555', status: 'Completed' },
  { hotel: 'Shangri-La Colombo', dates: 'Nov 2–4, 2024 · 2 nights', price: '$440', status: 'Completed' },
];

const SETTINGS = [
  { icon: 'notifications-outline', label: 'Notifications', sub: 'Manage your alerts' },
  { icon: 'shield-outline', label: 'Privacy & Security', sub: 'Manage account safety' },
  { icon: 'help-circle-outline', label: 'Help & Support', sub: 'FAQs and contact us' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
const AccountScreen = () => {
  const [profileName, setProfileName] = useState(global.userName || '');
  const [profileEmail, setProfileEmail] = useState(global.userEmail || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFS);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const [editPrefsObj, setEditPrefsObj] = useState(DEFAULT_PREFS);
  const [showPrefsModal, setShowPrefsModal] = useState(false);

  // Load persisted profile on mount
  useEffect(() => {
    // Always prefer global.userEmail (set at login / app restore)
    if (global.userEmail) {
      setProfileEmail(global.userEmail);
    }
    if (global.userName) {
      setProfileName(global.userName);
    }

    AsyncStorage.getItem(PROFILE_KEY).then(raw => {
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.name) setProfileName(saved.name);
        if (saved.phone !== undefined) setProfilePhone(saved.phone);
        if (saved.photo) setProfilePhoto(saved.photo);
        if (saved.preferences) setPreferences({ ...DEFAULT_PREFS, ...saved.preferences });
      }
    }).catch(() => { });
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const openPrefs = () => {
    setEditPrefsObj({ ...preferences });
    setShowPrefsModal(true);
  };

  const savePrefs = async () => {
    setPreferences(editPrefsObj);
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({
        name: profileName, phone: profilePhone, photo: profilePhoto, preferences: editPrefsObj
      }));
    } catch (e) { console.warn('Prefs save failed', e); }
    setShowPrefsModal(false);
    // Alert.alert('Saved', 'Your travel preferences have been updated.');
  };

  const toggleDest = (d) => {
    setEditPrefsObj(prev => ({
      ...prev,
      destinations: prev.destinations.includes(d)
        ? prev.destinations.filter(x => x !== d)
        : [...prev.destinations, d]
    }));
  };

  const toggleAmenity = (a) => {
    setEditPrefsObj(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a]
    }));
  };

  const openEdit = () => {
    setEditName(profileName);
    setEditPhone(profilePhone);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) { Alert.alert('Name required', 'Please enter your full name.'); return; }
    const newName = editName.trim();
    const newPhone = editPhone.trim();
    setProfileName(newName);
    setProfilePhone(newPhone);
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ name: newName, phone: newPhone, photo: profilePhoto, preferences }));
    } catch (e) { console.warn('Profile save failed', e); }
    setShowEditModal(false);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive',
          onPress: async () => {
            await clearStoredAuth();
            global.isAuthenticated = false;
            global.userName = null;
          },
        },
      ]
    );
  };

  const initials = profileName
    .split(' ')
    .map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openEdit} style={styles.avatarWrapper}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profileName}</Text>
          <Text style={styles.email}>{profileEmail}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Bookings', value: 2 },
              { label: 'Reviews', value: 5 },
              { label: 'Saved', value: 2 },
            ].map((stat, i) => (
              <View key={stat.label} style={[styles.statItem, i === 1 && styles.statDivided]}>
                <Text style={styles.statNum}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>

          {/* ── Travel Preferences ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Travel Preferences</Text>
              <TouchableOpacity onPress={openPrefs}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.prefRow}>
              <Ionicons name="location-outline" size={16} color="#f59e0b" />
              <Text style={styles.prefText}>Preferred: {preferences.destinations.length > 0 ? preferences.destinations.join(', ') : 'Not selected'}</Text>
            </View>
            <View style={styles.prefRow}>
              <Ionicons name="star-outline" size={16} color="#f59e0b" />
              <Text style={styles.prefText}>Min Rating: {preferences.rating || 'Not selected'}</Text>
            </View>
            <View style={styles.prefRow}>
              <Ionicons name="flame-outline" size={16} color="#f59e0b" />
              <Text style={styles.prefText}>Budget: ${preferences.minBudget}–${preferences.maxBudget}/night</Text>
            </View>
            <Text style={styles.prefAmenitiesLabel}>Preferred Amenities</Text>
            <View style={styles.amenityChips}>
              {preferences.amenities.length > 0 ? preferences.amenities.map(a => (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>{a}</Text>
                </View>
              )) : <Text style={{ fontSize: 13, color: '#94a3b8' }}>None selected</Text>}
            </View>
          </View>

          {/* ── AI Profile ── */}
          <View style={styles.card}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconBox}>
                <Ionicons name="flash" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Your AI Profile</Text>
                <Text style={styles.aiSub}>Based on your travel history</Text>
              </View>
            </View>
            {AI_TRAITS.map(t => (
              <View key={t.label} style={styles.traitRow}>
                <Text style={styles.traitEmoji}>{t.emoji}</Text>
                <Text style={styles.traitLabel}>{t.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Booking History ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Booking History</Text>
              <TouchableOpacity><Text style={styles.editBtn}>View All</Text></TouchableOpacity>
            </View>
            {BOOKING_HISTORY.map((b, i) => (
              <View key={i} style={[styles.bookingRow, i > 0 && styles.bookingBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingHotel}>{b.hotel}</Text>
                  <Text style={styles.bookingDates}>{b.dates}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.bookingPrice}>{b.price}</Text>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>{b.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── Settings ── */}
          <View style={styles.card}>
            {SETTINGS.map((s, i) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.settingRow, i > 0 && styles.settingBorder]}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name={s.icon} size={20} color="#64748b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{s.label}</Text>
                  <Text style={styles.settingSub}>{s.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Sign Out ── */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Title + close */}
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={styles.modalAvatarWrap}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.modalAvatar} />
              ) : (
                <View style={[styles.modalAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <TouchableOpacity onPress={pickPhoto}>
                <View style={styles.modalCameraIcon}>
                  <Ionicons name="camera" size={16} color="#f59e0b" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickPhoto}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Email — read only */}
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.inputWrap, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <Text style={styles.disabledInput}>{profileEmail}</Text>
              <Ionicons name="lock-closed-outline" size={16} color="#cbd5e1" />
            </View>

            {/* Phone */}
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+94 77 123 4567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>

            {/* Save */}
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Travel Preferences Modal ── */}
      <Modal visible={showPrefsModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { height: '85%', paddingBottom: 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Travel Preferences</Text>
              <TouchableOpacity onPress={() => setShowPrefsModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

              {/* Destinations */}
              <Text style={styles.sectionHeader}>Preferred Destinations</Text>
              <View style={styles.chipGroup}>
                {DESTINATIONS.map(d => {
                  const isSelected = editPrefsObj.destinations.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.selChip, isSelected && styles.selChipActive]}
                      onPress={() => toggleDest(d)}
                    >
                      {isSelected && <Ionicons name="location-outline" size={14} color="#fff" style={{ marginRight: 4 }} />}
                      {!isSelected && <Ionicons name="location-outline" size={14} color="#94a3b8" style={{ marginRight: 4 }} />}
                      <Text style={[styles.selChipText, isSelected && styles.selChipTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Star Rating */}
              <Text style={styles.sectionHeader}>Minimum Star Rating</Text>
              <View style={styles.ratingGroup}>
                {RATINGS.map(r => {
                  const isSelected = editPrefsObj.rating === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.ratingBtn, isSelected && styles.ratingBtnActive]}
                      onPress={() => setEditPrefsObj({ ...editPrefsObj, rating: isSelected ? null : r })}
                    >
                      <Ionicons name="star" size={14} color={isSelected ? "#fff" : "#f59e0b"} style={{ marginBottom: 2 }} />
                      <Text style={[styles.ratingBtnText, isSelected && styles.ratingBtnTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Budget */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
                <Text style={[styles.sectionHeader, { marginTop: 0, marginBottom: 0 }]}>Budget per Night</Text>
                <Text style={styles.budgetValText}>${editPrefsObj.minBudget}–${editPrefsObj.maxBudget}</Text>
              </View>

              <Text style={styles.budgetLabel}>Min: ${editPrefsObj.minBudget}</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={editPrefsObj.maxBudget}
                step={10}
                value={editPrefsObj.minBudget}
                onValueChange={(val) => setEditPrefsObj({ ...editPrefsObj, minBudget: val })}
                minimumTrackTintColor="#0c2340"
                maximumTrackTintColor="#e2e8f0"
                thumbTintColor="#0c2340"
              />

              <Text style={styles.budgetLabel}>Max: ${editPrefsObj.maxBudget}</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={editPrefsObj.minBudget}
                maximumValue={500}
                step={10}
                value={editPrefsObj.maxBudget}
                onValueChange={(val) => setEditPrefsObj({ ...editPrefsObj, maxBudget: val })}
                minimumTrackTintColor="#f59e0b"
                maximumTrackTintColor="#e2e8f0"
                thumbTintColor="#f59e0b"
              />

              {/* Amenities */}
              <Text style={styles.sectionHeader}>Must-Have Amenities</Text>
              <View style={styles.chipGroup}>
                {AMENITIES.map(a => {
                  const isSelected = editPrefsObj.amenities.includes(a);
                  return (
                    <TouchableOpacity
                      key={a}
                      style={[styles.amenitySelChip, isSelected && styles.amenitySelChipActive]}
                      onPress={() => toggleAmenity(a)}
                    >
                      <Text style={[styles.amenitySelChipText, isSelected && styles.amenitySelChipTextActive]}>{a}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={savePrefs} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};


// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: '#0c2340',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: '#f59e0b',
  },
  avatarFallback: {
    backgroundColor: '#1e4d78',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#f59e0b' },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0c2340',
  },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: '#93c5fd', marginBottom: 24 },

  statsRow: { flexDirection: 'row', gap: 0 },
  statItem: { paddingHorizontal: 28, alignItems: 'center' },
  statDivided: {
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 12, color: '#93c5fd', marginTop: 2 },

  // Body
  body: { paddingHorizontal: 16, marginTop: -16 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0c2340' },
  editBtn: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },

  // Preferences
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  prefText: { fontSize: 14, color: '#475569' },
  prefAmenitiesLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 6, marginBottom: 10 },
  amenityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  // AI Profile
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  aiIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0c2340', justifyContent: 'center', alignItems: 'center',
  },
  aiSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  traitEmoji: { fontSize: 20 },
  traitLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },

  // Bookings
  bookingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  bookingBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  bookingHotel: { fontSize: 14, fontWeight: '700', color: '#0c2340', marginBottom: 3 },
  bookingDates: { fontSize: 12, color: '#94a3b8' },
  bookingPrice: { fontSize: 16, fontWeight: '800', color: '#0c2340', marginBottom: 4 },
  completedBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  completedText: { fontSize: 11, color: '#16a34a', fontWeight: '700' },

  // Settings
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  settingBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  settingIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  settingLabel: { fontSize: 14, fontWeight: '700', color: '#0c2340' },
  settingSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Sign Out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderWidth: 1.5, borderColor: '#fecaca',
    backgroundColor: '#fff5f5', borderRadius: 16,
    paddingVertical: 16, marginBottom: 4,
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },

  // Edit Profile Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0c2340' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  modalAvatarWrap: { alignItems: 'center', marginBottom: 24 },
  modalAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#f59e0b' },
  modalCameraIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff7ed',
    borderWidth: 2, borderColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
    marginTop: -16, marginLeft: 52,
  },
  changePhotoText: { fontSize: 13, color: '#f59e0b', fontWeight: '700', marginTop: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#0c2340', marginBottom: 8, marginTop: 4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  inputDisabled: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, color: '#0c2340' },
  disabledInput: { flex: 1, fontSize: 14, color: '#94a3b8' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#0c2340',
    borderRadius: 16, paddingVertical: 16, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Prefs Edit UI
  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#0c2340', marginTop: 24, marginBottom: 12 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  selChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  selChipActive: { backgroundColor: '#0c2340', borderColor: '#0c2340' },
  selChipText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  selChipTextActive: { color: '#fff' },

  ratingGroup: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  ratingBtn: {
    flex: 1, alignItems: 'center', backgroundColor: '#f1f5f9',
    paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0'
  },
  ratingBtnActive: { backgroundColor: '#0c2340', borderColor: '#0c2340' },
  ratingBtnText: { fontSize: 13, color: '#64748b', fontWeight: '700', marginTop: 2 },
  ratingBtnTextActive: { color: '#fff' },

  budgetValText: { fontSize: 16, fontWeight: '800', color: '#f59e0b' },
  budgetLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 10, marginLeft: 4 },

  amenitySelChip: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  amenitySelChipActive: { borderColor: '#f59e0b', backgroundColor: '#fff7ed' },
  amenitySelChipText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  amenitySelChipTextActive: { color: '#f59e0b', fontWeight: '700' },
});



export default AccountScreen;
