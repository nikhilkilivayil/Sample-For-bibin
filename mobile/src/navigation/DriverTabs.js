import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DriverHomeScreen from '../screens/DriverHomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();

const icon = (label) => ({ focused }) => (
  <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{label}</Text>
);

export default function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Drive" component={DriverHomeScreen} options={{ tabBarIcon: icon('🛞') }} />
      <Tab.Screen name="Earnings" component={HistoryScreen} options={{ tabBarIcon: icon('💵') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}
