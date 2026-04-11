/**
 * Auth service - communicates with backend API for sign up / sign in.
 * Sign up data is stored in the backend database (SQLite); sign in validates against it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

/** Base URL for auth (same backend as apiService - no trailing /api). */
function getAuthBaseUrl() {
  try {
    const apiService = require('./apiService').default;
    return (apiService.baseUrl || '').replace(/\/api\/?$/, '') || 'http://10.0.2.2:5000';
  } catch {
    const { API_BASE_URL } = require('../config');
    return API_BASE_URL;
  }
}

/**
 * Register a new user (sign up). Stores user in backend database.
 * @param {{ email: string, password: string, name: string }} params
 * @returns {{ token: string, user: { id, email, name } }}
 */
export async function register({ email, password, name, preferences = [] }) {
  const base = getAuthBaseUrl();
  const url = `${base}/api/auth/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name,
      country: 'Sri Lanka',
      age_group: '25-34',
      travel_frequency: 'occasional',
      preferences,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const raw = data.detail;
    const message = Array.isArray(raw) ? (raw[0]?.msg || raw[0]?.loc?.join?.(' ') || 'Registration failed') : (raw || 'Registration failed');
    throw new Error(typeof message === 'string' ? message : 'Registration failed');
  }

  return data;
}

/**
 * Sign in - validates credentials against backend database. Only registered users can sign in.
 * @param {{ email: string, password: string }} params
 * @returns {{ token: string, user: { id, email, name } }}
 */
export async function login({ email, password }) {
  const base = getAuthBaseUrl();
  const url = `${base}/api/auth/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const raw = data.detail;
    const message = Array.isArray(raw) ? (raw[0]?.msg || 'Invalid email or password') : (raw || 'Invalid email or password');
    throw new Error(typeof message === 'string' ? message : 'Invalid email or password');
  }

  return data;
}

/**
 * Store auth token and user in AsyncStorage (after successful login/register).
 */
export async function setStoredAuth(token, user) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Get stored auth from AsyncStorage. Returns null if not logged in.
 */
export async function getStoredAuth() {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!token || !userJson) return null;
  try {
    const user = JSON.parse(userJson);
    return { token, user };
  } catch {
    return null;
  }
}

/**
 * Clear stored auth (logout).
 */
export async function clearStoredAuth() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}
