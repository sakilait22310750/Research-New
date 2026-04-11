import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Available travel preferences shown during signup
const PREFERENCE_OPTIONS = [
  { id: 'beach', label: '🏖️ Beach', desc: 'Coastal & seaside hotels' },
  { id: 'luxury', label: '💎 Luxury', desc: 'Premium & 5-star stays' },
  { id: 'budget', label: '💰 Budget', desc: 'Value for money' },
  { id: 'adventure', label: '🏔️ Adventure', desc: 'Wildlife & national parks' },
  { id: 'culture', label: '🏛️ Culture', desc: 'Heritage & city stays' },
  { id: 'nature', label: '🌿 Nature', desc: 'Garden, lake & hill stays' },
];

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Signup step: 'credentials' | 'preferences'
  const [signupStep, setSignupStep] = useState('credentials');
  const [selectedPrefs, setSelectedPrefs] = useState([]);

  // UI States
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePref = (id) => {
    setSelectedPrefs(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Move from credentials form → preference picker
  const handleNextStep = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setSignupStep('preferences');
  };

  const handleAuth = async () => {
    if (!isSignup && (!email || !password)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { register, login, setStoredAuth } = require('../services/authService');

      let result;
      if (isSignup) {
        result = await register({ email, password, name, preferences: selectedPrefs });
      } else {
        result = await login({ email, password });
      }

      const { token, user } = result;
      await setStoredAuth(token, user);

      // Persist preferences so recommendation calls can read them on every launch
      const prefsToStore = isSignup ? selectedPrefs : (user.preferences || []);
      await AsyncStorage.setItem('user_preferences', JSON.stringify(prefsToStore));

      if (isSignup) {
        Alert.alert('Success', 'Account created successfully! Please sign in.');
        setIsSignup(false);
        setSignupStep('credentials');
        setPassword('');
        setConfirmPassword('');
      } else {
        global.isAuthenticated = true;
        global.userName = user.name;
        global.userEmail = user.email;
        global.userId = String(user.id);
        global.userPreferences = prefsToStore;

        if (__DEV__) {
          console.log('[LoginScreen] Authenticated:', global.userName, '| prefs:', prefsToStore);
        }
      }
    } catch (err) {
      const message = err.message || (isSignup ? 'Registration failed' : 'Sign in failed');
      Alert.alert(isSignup ? 'Registration Failed' : 'Sign In Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Preference picker step (signup only) ─────────────────────────────────
  if (isSignup && signupStep === 'preferences') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backgroundGlowTop} />

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => setSignupStep('credentials')}>
          <Ionicons name="arrow-back" size={24} color="#0c2340" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="compass" size={44} color="#ffffff" />
            </View>
            <Text style={styles.title}>Your Travel Style</Text>
            <Text style={styles.subtitle}>
              Pick what you love — we'll personalise your hotel picks and experiences.
            </Text>
          </View>

          <View style={styles.prefGrid}>
            {PREFERENCE_OPTIONS.map(opt => {
              const selected = selectedPrefs.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.prefCard, selected && styles.prefCardSelected]}
                  onPress={() => togglePref(opt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.prefLabel}>{opt.label}</Text>
                  <Text style={styles.prefDesc}>{opt.desc}</Text>
                  {selected && (
                    <View style={styles.prefCheckWrapper}>
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAuth}
            disabled={isLoading}
          >
            <Text style={styles.primaryBtnText}>
              {isLoading ? 'Creating Account...' : (selectedPrefs.length > 0 ? `Create Account (${selectedPrefs.length} selected)` : 'Skip & Create Account')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Credentials form ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Subtle top background glow from the mockup */}
      <View style={styles.backgroundGlowTop} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="compass" size={44} color="#ffffff" />
            </View>
            <Text style={styles.title}>
              {isSignup ? 'Discover Adventures' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'Create your account to explore stays, save favorites, and connect with trusted local guides.'
                : 'Log in to explore personalised hotel picks and discover real traveller sentiments.'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {isSignup && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconWrap}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {isSignup && (
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIconWrap}>
                  <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            )}

            {!isSignup && (
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.checkboxWrap}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forget Password</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={isSignup ? handleNextStep : handleAuth}
              disabled={isLoading}
            >
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Login')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text style={styles.socialBtnText}>Log in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <Text style={styles.socialBtnText}>Log in with Apple</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomFooter}>
        <Text style={styles.footerText}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsSignup(!isSignup);
            setSignupStep('credentials');
            setSelectedPrefs([]);
          }}
        >
          <Text style={styles.footerLink}>
            {isSignup ? 'Login' : 'Sign up'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7', // Soft cream/off-white background
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: '#fcd34d', // Warm golden glow matching the mockup vibes
    opacity: 0.15,
    borderBottomLeftRadius: 300,
    borderBottomRightRadius: 300,
    transform: [{ scaleX: 1.5 }],
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 30, // Squircle shape like mockup
    backgroundColor: '#0c2340', // Deep Navy theme color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIconWrap: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  checkboxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0c2340',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0c2340',
  },
  rememberText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    color: '#0c2340',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#0c2340', // Navy
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0c2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94a3b8',
    fontSize: 14,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 56,
    marginBottom: 16,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 12,
  },
  bottomFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2340',
  },

  // ── Preference picker styles ──────────────────
  prefGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 30,
    justifyContent: 'center',
  },
  prefCard: {
    width: '46%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  prefCardSelected: {
    borderColor: '#0c2340',
    backgroundColor: '#f1f5f9'
  },
  prefLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  prefDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  prefCheckWrapper: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#0c2340',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;

