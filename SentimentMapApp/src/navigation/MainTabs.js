import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import SearchScreen from '../screens/SearchScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import AIChatScreen from '../screens/AIChatScreen';
import HotelFiltersScreen from '../screens/HotelFiltersScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      lazy={true}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconColor;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            iconColor = focused ? '#f59e0b' : '#94a3b8';
          } else if (route.name === 'Hotels') {
            iconName = focused ? 'bed' : 'bed-outline';
            iconColor = focused ? '#f59e0b' : '#94a3b8';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
            iconColor = focused ? '#f59e0b' : '#94a3b8';
          } else if (route.name === 'AIChat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            iconColor = focused ? '#f59e0b' : '#94a3b8';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
            iconColor = focused ? '#f59e0b' : '#94a3b8';
          }

          return <Ionicons name={iconName} size={size} color={iconColor} />;
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={RecommendationsScreen}
        options={{ title: 'Home' }}
        lazy={false}
      />
      <Tab.Screen
        name="Hotels"
        component={HotelFiltersScreen}
        options={{ title: 'Hotels' }}
        lazy={true}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search' }}
        lazy={true}
      />
      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{ title: 'AI Chat' }}
        lazy={true}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Account' }}
        lazy={true}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
