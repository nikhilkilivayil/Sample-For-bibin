import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RiderHomeScreen from '../screens/RiderHomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();

const icon = (label) => ({ focused }) => (
  <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{label}</Text>
);

export default function RiderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Ride" component={RiderHomeScreen} options={{ tabBarIcon: icon('🚗') }} />
      <Tab.Screen name="Trips" component={HistoryScreen} options={{ tabBarIcon: icon('🧾') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}
