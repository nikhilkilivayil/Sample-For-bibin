import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import MapPlaceholder from '../components/MapPlaceholder';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { regionFor } from '../utils/location';
import { colors, radius, spacing, typography } from '../utils/theme';

const STATUS_LABEL = {
  requested: 'Looking for a driver…',
  accepted: 'Driver is on the way',
  driver_arrived: 'Driver has arrived',
  in_progress: 'On trip',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

export default function RideTrackingScreen({ route, navigation }) {
  const { rideId } = route.params;
  const { socket } = useSocket();
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/rides/${rideId}`);
        if (!cancelled) setRide(data.ride);
      } catch (e) {
        Alert.alert('Failed to load ride', e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.emit('ride:join', rideId);
    const handlers = {
      'ride:accepted': ({ ride: r }) => setRide(r),
      'ride:driver_arrived': ({ ride: r }) => setRide(r),
      'ride:in_progress': ({ ride: r }) => setRide(r),
      'ride:completed': ({ ride: r }) => setRide(r),
      'ride:cancelled': ({ ride: r }) => setRide(r),
      'driver:location': ({ lat, lng }) => setDriverPos({ lat, lng }),
    };
    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
      socket.emit('ride:leave', rideId);
    };
  }, [socket, rideId]);

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post(`/rides/${rideId}/cancel`);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Cancel failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const advance = async (action) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/rides/${rideId}/${action}`);
      setRide(data.ride);
    } catch (e) {
      Alert.alert('Action failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const rate = async (stars) => {
    try {
      await api.post(`/rides/${rideId}/rate`, { stars });
      Alert.alert('Thanks!', 'Your rating was saved.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Rating failed', e.message);
    }
  };

  if (!ride) {
    return (
      <Screen>
        <Text style={typography.body}>Loading ride…</Text>
      </Screen>
    );
  }

  const region = regionFor(ride.pickup.lat, ride.pickup.lng, 0.04);
  const markers = [
    { id: 'p', lat: ride.pickup.lat, lng: ride.pickup.lng, title: 'Pickup', color: 'green' },
    { id: 'd', lat: ride.dropoff.lat, lng: ride.dropoff.lng, title: 'Dropoff', color: 'red' },
  ];
  if (driverPos) markers.push({ id: 'driver', lat: driverPos.lat, lng: driverPos.lng, title: 'Driver', color: 'blue' });

  const isDriver = user?.role === 'driver';

  return (
    <Screen padded={false}>
      <View style={{ flex: 1.1 }}>
        <MapPlaceholder region={region} markers={markers} />
      </View>
      <ScrollView style={{ flex: 1, padding: spacing(2) }}>
        <View
          style={{
            padding: spacing(1.5),
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            marginBottom: spacing(1.5),
          }}
        >
          <Text style={typography.h3}>{STATUS_LABEL[ride.status]}</Text>
          <Text style={typography.caption}>
            {ride.distanceKm} km • {ride.durationMin} min • ${ride.fare.toFixed(2)} • {ride.vehicleType}
          </Text>
        </View>

        <Text style={typography.caption}>From</Text>
        <Text style={[typography.body, { marginBottom: spacing(1) }]}>{ride.pickup.label}</Text>
        <Text style={typography.caption}>To</Text>
        <Text style={[typography.body, { marginBottom: spacing(2) }]}>{ride.dropoff.label}</Text>

        {isDriver && ride.status === 'accepted' && (
          <Button title="I have arrived" onPress={() => advance('arrived')} loading={busy} />
        )}
        {isDriver && ride.status === 'driver_arrived' && (
          <Button title="Start trip" onPress={() => advance('start')} loading={busy} />
        )}
        {isDriver && ride.status === 'in_progress' && (
          <Button title="Complete trip" variant="accent" onPress={() => advance('complete')} loading={busy} />
        )}

        {!isDriver && ['requested', 'accepted', 'driver_arrived'].includes(ride.status) && (
          <Button title="Cancel ride" variant="danger" onPress={cancel} loading={busy} />
        )}

        {ride.status === 'completed' && (
          <View style={{ marginTop: spacing(1) }}>
            <Text style={[typography.h3, { marginBottom: spacing(1) }]}>Rate this trip</Text>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Button
                  key={s}
                  title={`${s}★`}
                  variant="ghost"
                  onPress={() => rate(s)}
                  style={{ flex: 1, marginRight: s < 5 ? 6 : 0 }}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
