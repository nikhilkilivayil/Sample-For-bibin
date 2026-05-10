import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Email and password required');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[typography.h1, { marginBottom: spacing(0.5) }]}>Welcome back</Text>
        <Text style={[typography.caption, { marginBottom: spacing(3) }]}>
          Sign in to request rides or start driving.
        </Text>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button title="Sign in" onPress={submit} loading={busy} />
        <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: spacing(2) }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            New here? <Text style={{ color: colors.primary, fontWeight: '600' }}>Create an account</Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
