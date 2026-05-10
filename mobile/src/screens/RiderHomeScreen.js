import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import MapPlaceholder from '../components/MapPlaceholder';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { getCurrentLocation, regionFor } from '../utils/location';
import { colors, radius, spacing, typography } from '../utils/theme';

const VEHICLE_TYPES = [
  { key: 'pool', label: 'Pool', sub: 'Share & save' },
  { key: 'standard', label: 'Standard', sub: 'Affordable rides' },
  { key: 'premium', label: 'Premium', sub: 'Comfort & space' },
];

export default function RiderHomeScreen({ navigation }) {
  const { socket } = useSocket();
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState({ label: '', lat: '', lng: '' });
  const [vehicleType, setVehicleType] = useState('standard');
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        setPickup({ label: 'Current location', ...loc });
      } catch (e) {
        Alert.alert('Location', e.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onAccepted = ({ ride }) => {
      setActiveRide(ride);
      navigation.navigate('RideTracking', { rideId: ride._id });
    };
    socket.on('ride:accepted', onAccepted);
    return () => socket.off('ride:accepted', onAccepted);
  }, [socket, navigation]);

  const fetchEstimate = useCallback(async () => {
    if (!pickup || !dropoff.lat || !dropoff.lng) {
      return Alert.alert('Where to?', 'Enter destination coordinates first.');
    }
    setEstimating(true);
    try {
      const { data } = await api.post('/rides/estimate', {
        pickup,
        dropoff: { label: dropoff.label || 'Destination', lat: Number(dropoff.lat), lng: Number(dropoff.lng) },
        vehicleType,
      });
      setEstimate(data);
    } catch (e) {
      Alert.alert('Estimate failed', e.message);
    } finally {
      setEstimating(false);
    }
  }, [pickup, dropoff, vehicleType]);

  const requestRide = async () => {
    if (!estimate) return;
    setRequesting(true);
    try {
      const { data } = await api.post('/rides', {
        pickup,
        dropoff: { label: dropoff.label || 'Destination', lat: Number(dropoff.lat), lng: Number(dropoff.lng) },
        vehicleType,
      });
      setActiveRide(data.ride);
      socket?.emit('ride:join', data.ride._id);
      navigation.navigate('RideTracking', { rideId: data.ride._id });
    } catch (e) {
      Alert.alert('Request failed', e.message);
    } finally {
      setRequesting(false);
    }
  };

  const region = pickup ? regionFor(pickup.lat, pickup.lng) : null;
  const markers = [];
  if (pickup) markers.push({ id: 'p', lat: pickup.lat, lng: pickup.lng, title: 'Pickup', color: 'green' });
  if (dropoff.lat && dropoff.lng) {
    markers.push({ id: 'd', lat: Number(dropoff.lat), lng: Number(dropoff.lng), title: 'Dropoff', color: 'red' });
  }

  return (
    <Screen padded={false}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1.2 }}>
          <MapPlaceholder region={region} markers={markers} />
        </View>
        <ScrollView style={{ flex: 1, padding: spacing(2) }}>
          <Text style={typography.h2}>Where to?</Text>
          <Text style={[typography.caption, { marginBottom: spacing(1.5) }]}>
            Drop a pin or paste destination coordinates.
          </Text>

          <Input
            label="Destination label"
            placeholder="e.g. Office"
            value={dropoff.label}
            onChangeText={(v) => setDropoff((d) => ({ ...d, label: v }))}
          />
          <View style={{ flexDirection: 'row' }}>
            <Input
              label="Lat"
              keyboardType="numeric"
              value={String(dropoff.lat)}
              onChangeText={(v) => setDropoff((d) => ({ ...d, lat: v }))}
              style={{ flex: 1, marginRight: spacing(1) }}
            />
            <Input
              label="Lng"
              keyboardType="numeric"
              value={String(dropoff.lng)}
              onChangeText={(v) => setDropoff((d) => ({ ...d, lng: v }))}
              style={{ flex: 1 }}
            />
          </View>

          <Text style={[typography.h3, { marginTop: spacing(1), marginBottom: spacing(1) }]}>Choose a ride</Text>
          {VEHICLE_TYPES.map((v) => (
            <Pressable
              key={v.key}
              onPress={() => setVehicleType(v.key)}
              style={{
                padding: spacing(1.5),
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: vehicleType === v.key ? colors.primary : colors.border,
                marginBottom: spacing(1),
                backgroundColor: vehicleType === v.key ? '#0F0F1010' : colors.surface,
              }}
            >
              <Text style={typography.h3}>{v.label}</Text>
              <Text style={typography.caption}>{v.sub}</Text>
            </Pressable>
          ))}

          <Button title="Get fare estimate" variant="ghost" onPress={fetchEstimate} loading={estimating} />
          {estimate && (
            <View
              style={{
                marginTop: spacing(1.5),
                padding: spacing(1.5),
                borderRadius: radius.md,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={typography.h3}>${estimate.fare.toFixed(2)}</Text>
              <Text style={typography.caption}>
                {estimate.distanceKm} km • ~{estimate.durationMin} min
              </Text>
            </View>
          )}

          <Button
            title={activeRide ? 'Ride already in progress' : 'Request ride'}
            onPress={requestRide}
            disabled={!estimate || !!activeRide}
            loading={requesting}
            style={{ marginTop: spacing(2), marginBottom: spacing(4) }}
          />
        </ScrollView>
      </View>
    </Screen>
  );
}
