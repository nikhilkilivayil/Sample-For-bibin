import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../utils/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <Screen>
      <Text style={typography.h2}>Profile</Text>
      <View
        style={{
          marginTop: spacing(2),
          padding: spacing(2),
          backgroundColor: colors.surface,
          borderRadius: radius.md,
        }}
      >
        <Text style={typography.h3}>{user.name}</Text>
        <Text style={typography.caption}>{user.email}</Text>
        {user.phone ? <Text style={typography.caption}>{user.phone}</Text> : null}
        <Text style={[typography.caption, { marginTop: spacing(1) }]}>
          Role: <Text style={{ fontWeight: '600', color: colors.text }}>{user.role}</Text>
        </Text>
        <Text style={typography.caption}>Rating: ★ {user.rating?.toFixed(1) ?? '5.0'}</Text>
      </View>
      <Button title="Sign out" variant="danger" onPress={logout} style={{ marginTop: spacing(3) }} />
    </Screen>
  );
}
