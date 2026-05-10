import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, Alert, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import MapPlaceholder from '../components/MapPlaceholder';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { getCurrentLocation, regionFor } from '../utils/location';
import { colors, radius, spacing, typography } from '../utils/theme';

export default function DriverHomeScreen({ navigation }) {
  const { socket } = useSocket();
  const [online, setOnline] = useState(false);
  const [loc, setLoc] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [busy, setBusy] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const here = await getCurrentLocation();
        setLoc(here);
      } catch (e) {
        Alert.alert('Location', e.message);
      }
      try {
        const { data } = await api.get('/drivers/active-ride');
        if (data.ride) setActiveRide(data.ride);
      } catch (_e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onNew = ({ ride }) => setIncoming(ride);
    const onCancelled = ({ ride }) => {
      if (incoming && ride._id === incoming._id) setIncoming(null);
      if (activeRide && ride._id === activeRide._id) setActiveRide(null);
    };
    socket.on('ride:new', onNew);
    socket.on('ride:cancelled', onCancelled);
    return () => {
      socket.off('ride:new', onNew);
      socket.off('ride:cancelled', onCancelled);
    };
  }, [socket, incoming, activeRide]);

  useEffect(() => {
    if (!online || !socket) return undefined;
    const interval = setInterval(async () => {
      try {
        const here = await getCurrentLocation();
        setLoc(here);
        socket.emit('driver:location', {
          lat: here.lat,
          lng: here.lng,
          rideId: activeRide?._id,
        });
      } catch (_e) {
        // ignore transient errors
      }
    }, 8000);
    watchRef.current = interval;
    return () => clearInterval(interval);
  }, [online, socket, activeRide]);

  const toggleOnline = async (value) => {
    setBusy(true);
    try {
      await api.post('/drivers/status', { isOnline: value });
      if (value && loc) {
        await api.post('/drivers/location', { lat: loc.lat, lng: loc.lng });
      }
      setOnline(value);
    } catch (e) {
      Alert.alert('Status update failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!incoming) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/rides/${incoming._id}/accept`);
      setActiveRide(data.ride);
      setIncoming(null);
      socket?.emit('ride:join', data.ride._id);
      navigation.navigate('RideTracking', { rideId: data.ride._id });
    } catch (e) {
      Alert.alert('Accept failed', e.message);
      setIncoming(null);
    } finally {
      setBusy(false);
    }
  };

  const decline = () => setIncoming(null);

  const region = loc ? regionFor(loc.lat, loc.lng) : null;
  const markers = loc ? [{ id: 'me', lat: loc.lat, lng: loc.lng, title: 'You', color: 'blue' }] : [];

  return (
    <Screen padded={false}>
      <View style={{ flex: 1.2 }}>
        <MapPlaceholder region={region} markers={markers} />
      </View>
      <ScrollView style={{ flex: 1, padding: spacing(2) }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing(1.5),
            backgroundColor: colors.surface,
            borderRadius: radius.md,
          }}
        >
          <View>
            <Text style={typography.h3}>{online ? 'You are online' : 'Go online'}</Text>
            <Text style={typography.caption}>
              {online ? 'Receiving requests in your area' : 'Flip the switch to start driving'}
            </Text>
          </View>
          <Switch value={online} onValueChange={toggleOnline} disabled={busy} />
        </View>

        {incoming && (
          <View
            style={{
              marginTop: spacing(2),
              padding: spacing(2),
              borderRadius: radius.md,
              borderWidth: 2,
              borderColor: colors.accent,
            }}
          >
            <Text style={typography.h3}>New ride request</Text>
            <Text style={typography.caption}>
              {incoming.distanceKm} km • ${incoming.fare.toFixed(2)} • {incoming.vehicleType}
            </Text>
            <Text style={[typography.body, { marginTop: spacing(1) }]}>
              Pickup: {incoming.pickup.label}
            </Text>
            <Text style={typography.body}>Dropoff: {incoming.dropoff.label}</Text>
            <View style={{ flexDirection: 'row', marginTop: spacing(1.5) }}>
              <Button title="Decline" variant="ghost" onPress={decline} style={{ flex: 1, marginRight: spacing(1) }} />
              <Button title="Accept" variant="accent" onPress={accept} loading={busy} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {activeRide && (
          <View style={{ marginTop: spacing(2) }}>
            <Button
              title="Open active trip"
              onPress={() => navigation.navigate('RideTracking', { rideId: activeRide._id })}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
