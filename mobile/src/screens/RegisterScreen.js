import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('rider');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleColor: '',
    vehicleType: 'standard',
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) {
      return Alert.alert('Missing info', 'Name, email and password are required');
    }
    if (role === 'driver' && (!form.licenseNumber || !form.vehicleMake || !form.vehiclePlate)) {
      return Alert.alert('Driver info', 'License and vehicle details are required');
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        role,
      };
      if (role === 'driver') {
        payload.licenseNumber = form.licenseNumber;
        payload.vehicle = {
          make: form.vehicleMake,
          model: form.vehicleModel,
          plate: form.vehiclePlate,
          color: form.vehicleColor,
          type: form.vehicleType,
        };
      }
      await register(payload);
    } catch (err) {
      Alert.alert('Sign up failed', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[typography.h1, { marginBottom: spacing(0.5) }]}>Create your account</Text>
        <Text style={[typography.caption, { marginBottom: spacing(2) }]}>Choose how you want to use the app.</Text>

        <View style={{ flexDirection: 'row', marginBottom: spacing(2) }}>
          {['rider', 'driver'].map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={{
                flex: 1,
                paddingVertical: spacing(1.5),
                marginRight: r === 'rider' ? spacing(1) : 0,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: role === r ? colors.primary : colors.border,
                backgroundColor: role === r ? colors.primary : colors.surface,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: role === r ? '#fff' : colors.text, fontWeight: '600' }}>
                {r === 'rider' ? 'Ride' : 'Drive'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="Full name" value={form.name} onChangeText={set('name')} />
        <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Input label="Password" value={form.password} onChangeText={set('password')} secureTextEntry />

        {role === 'driver' && (
          <>
            <Text style={[typography.h3, { marginTop: spacing(1), marginBottom: spacing(1) }]}>Vehicle</Text>
            <Input label="Driver's license #" value={form.licenseNumber} onChangeText={set('licenseNumber')} />
            <Input label="Make" value={form.vehicleMake} onChangeText={set('vehicleMake')} />
            <Input label="Model" value={form.vehicleModel} onChangeText={set('vehicleModel')} />
            <Input label="Color" value={form.vehicleColor} onChangeText={set('vehicleColor')} />
            <Input label="Plate" value={form.vehiclePlate} onChangeText={set('vehiclePlate')} autoCapitalize="characters" />
          </>
        )}

        <Button title="Create account" onPress={submit} loading={busy} style={{ marginTop: spacing(1) }} />
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing(2), marginBottom: spacing(4) }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            Have an account? <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
