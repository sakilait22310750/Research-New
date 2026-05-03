// Polyfill Buffer for React Native
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import React, { Component } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

import LoginScreen from './src/screens/LoginScreen';
import LocationDetailScreen from './src/screens/LocationDetailScreen';
import SplashScreen from './src/screens/SplashScreen';
import { getStoredAuth } from './src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error Boundary for mobile debugging
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[App] ERROR CAUGHT:', error);
    console.error('[App] ERROR INFO:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>⚠️ App Error</Text>
          <Text style={errorStyles.text}>
            {this.state.error && this.state.error.toString()}
          </Text>
          <Text style={errorStyles.subtext}>
            Check console for details. Platform: {Platform.OS}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

const Stack = createStackNavigator();

// Navigation reference
const navigationRef = React.createRef();

// Authentication state - simple approach (global so LoginScreen can access it)
global.isAuthenticated = false;

// App component as class to avoid hooks
class App extends Component {
  constructor(props) {
    super(props);
    // Initialize auth state
    if (typeof global.isAuthenticated === 'undefined') {
      global.isAuthenticated = false;
    }

    this.state = {
      isAuthenticated: global.isAuthenticated,
      navigationKey: 0,
      showSplash: true,  // Show splash screen first
      hasViewedOnboarding: false // Track onboarding status
    };

    // Monitor auth state changes
    this.authCheckInterval = null;
    this.initialMount = true; // Track if this is the first mount
    this.navigationReady = false; // Track if navigation is ready
    this.restoredAuthFromStorage = false;
  }

  async componentDidMount() {
    try {
      const onboardingViewed = await AsyncStorage.getItem('has_viewed_onboarding');
      this.setState({ hasViewedOnboarding: onboardingViewed === 'true' });
    } catch (_) { }

    // Restore auth from storage if user was previously logged in
    try {
      const stored = await getStoredAuth();
      if (stored && stored.token && stored.user) {
        global.isAuthenticated = true;
        global.userName = stored.user.name;
        global.userEmail = stored.user.email;     // restore email for AccountScreen
        global.userId = String(stored.user.id);  // always string for FastAPI

        // Restore travel preferences saved at login time
        try {
          const prefsJson = await AsyncStorage.getItem('user_preferences');
          global.userPreferences = prefsJson ? JSON.parse(prefsJson) : [];
        } catch (_) {
          global.userPreferences = [];
        }
        this.restoredAuthFromStorage = true;
        this.setState({ isAuthenticated: true, showSplash: false });
      } else {
        global.isAuthenticated = false;
        this.setState({ isAuthenticated: false });
      }
    } catch (e) {
      global.isAuthenticated = false;
      this.setState({ isAuthenticated: false });
    }

    if (__DEV__) {
      console.log('[App] ===== APP STARTING =====');
      console.log('[App] Platform:', Platform.OS);
      console.log('[App] Authentication state:', global.isAuthenticated);

      // FOR TESTING ONLY: comment this out later
      // AsyncStorage.removeItem('has_viewed_onboarding');
      // AsyncStorage.removeItem('auth_user');
      // AsyncStorage.removeItem('auth_token');
    }

    // Monitor auth state changes
    this.authCheckInterval = setInterval(() => {
      if (global.isAuthenticated !== this.state.isAuthenticated) {
        if (__DEV__) {
          console.log('[App] Auth state changed:', global.isAuthenticated);
        }
        this.setState({
          isAuthenticated: global.isAuthenticated,
          navigationKey: this.state.navigationKey + 1 // Force remount
        });
      }
    }, 50);
  }

  componentWillUnmount() {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
  }

  renderUnauthenticatedNavigator() {
    // Show splash screen first, then login
    if (this.state.showSplash) {
      return (
        <SplashScreen
          onFinish={() => {
            this.setState({ showSplash: false });
          }}
        />
      );
    }

    let Onboarding1Screen;
    let Onboarding2Screen;
    let Onboarding3Screen;
    try {
      Onboarding1Screen = require('./src/screens/Onboarding1Screen').default;
      Onboarding2Screen = require('./src/screens/Onboarding2Screen').default;
      Onboarding3Screen = require('./src/screens/Onboarding3Screen').default;
    } catch (error) {
      if (__DEV__) {
        console.log('[App] Error loading onboarding screens:', error);
      }
    }

    return (
      <Stack.Navigator
        initialRouteName="Onboarding1"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#059669',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Onboarding1"
          component={Onboarding1Screen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding2"
          component={Onboarding2Screen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding3"
          component={Onboarding3Screen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  renderAuthenticatedNavigator() {
    // Dynamically import MainTabs only when rendering authenticated navigator
    let MainTabs;
    let HotelRecommendationsScreen;
    let LocationListScreen;
    let HotelRecommendationsListScreen;
    let HotelDetailScreen;
    let LocationSentimentScreen;
    let BookingDetailsScreen;
    let BookingGuestInfoScreen;
    let BookingConfirmationScreen;
    let WriteReviewScreen;
    try {
      MainTabs = require('./src/navigation/MainTabs').default;
      HotelRecommendationsScreen = require('./src/screens/HotelRecommendationsScreen').default;
      LocationListScreen = require('./src/screens/LocationListScreen').default;
      HotelRecommendationsListScreen = require('./src/screens/HotelRecommendationsListScreen').default;
      HotelDetailScreen = require('./src/screens/HotelDetailScreen').default;
      LocationSentimentScreen = require('./src/screens/LocationSentimentScreen').default;
      BookingDetailsScreen = require('./src/screens/BookingDetailsScreen').default;
      BookingGuestInfoScreen = require('./src/screens/BookingGuestInfoScreen').default;
      BookingConfirmationScreen = require('./src/screens/BookingConfirmationScreen').default;
      WriteReviewScreen = require('./src/screens/WriteReviewScreen').default;
    } catch (error) {
      if (__DEV__) {
        console.log('[App] Error loading authenticated screens:', error);
      }
      // Return unauthenticated navigator if MainTabs fails to load
      return this.renderUnauthenticatedNavigator();
    }

    return (
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0c2340',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: '',
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LocationList"
          component={LocationListScreen}
          options={{ title: 'Locations' }}
        />
        <Stack.Screen
          name="LocationDetail"
          component={LocationDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LocationSentiment"
          component={LocationSentimentScreen}
          options={({ route }) => ({ title: `${route.params?.location || 'Location'} Details` })}
        />
        <Stack.Screen
          name="HotelRecommendationsList"
          component={HotelRecommendationsListScreen}
          options={{ title: 'Hotel Recommendations' }}
        />
        <Stack.Screen
          name="HotelDetail"
          component={HotelDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HotelRecommendations"
          component={HotelRecommendationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BookingDetails"
          component={BookingDetailsScreen}
          options={{ title: 'Booking details' }}
        />
        <Stack.Screen
          name="BookingGuestInfo"
          component={BookingGuestInfoScreen}
          options={{ title: 'Guest information' }}
        />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{ title: 'Confirmation' }}
        />
        <Stack.Screen
          name="WriteReview"
          component={WriteReviewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  render() {
    const { isAuthenticated, navigationKey } = this.state;

    try {
      return (
        <ErrorBoundary>
          <PaperProvider>
            <NavigationContainer
              key={navigationKey} // Force remount when auth changes
              ref={navigationRef}
              onReady={() => {
                // Only reset auth on initial mount if we did NOT restore from storage
                if (this.initialMount) {
                  if (!this.restoredAuthFromStorage) {
                    global.isAuthenticated = false;
                    this.setState({ isAuthenticated: false });
                  }
                  this.initialMount = false;
                  if (__DEV__) {
                    console.log('[App] Navigation ready - Initial mount, restored:', this.restoredAuthFromStorage);
                  }
                } else {
                  if (__DEV__) {
                    console.log('[App] Navigation ready - Remount (auth:', global.isAuthenticated, ')');
                  }
                }

                this.navigationReady = true;
              }}
            >
              {/* CRITICAL: Render completely different navigators based on auth state */}
              {/* This ensures MainTabs is NEVER created until authenticated */}
              {isAuthenticated ? this.renderAuthenticatedNavigator() : this.renderUnauthenticatedNavigator()}
            </NavigationContainer>
          </PaperProvider>
        </ErrorBoundary>
      );
    } catch (error) {
      console.error('[App] FATAL ERROR:', error);
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>⚠️ Fatal Error</Text>
          <Text style={errorStyles.text}>{error.toString()}</Text>
        </View>
      );
    }
  }
}

export default App;



