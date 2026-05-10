import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RiderTabs from './RiderTabs';
import DriverTabs from './DriverTabs';
import RideTrackingScreen from '../screens/RideTrackingScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'driver' ? (
        <Stack.Screen name="DriverHome" component={DriverTabs} />
      ) : (
        <Stack.Screen name="RiderHome" component={RiderTabs} />
      )}
      <Stack.Screen
        name="RideTracking"
        component={RideTrackingScreen}
        options={{ headerShown: true, title: 'Your trip' }}
      />
    </Stack.Navigator>
  );
}
