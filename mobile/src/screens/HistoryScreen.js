import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { api } from '../services/api';
import { colors, radius, spacing, typography } from '../utils/theme';

export default function HistoryScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rides/history');
      setRides(data.rides);
    } catch (_e) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing(1) }]}>Trips</Text>
      <FlatList
        data={rides}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={[typography.caption, { marginTop: spacing(4), textAlign: 'center' }]}>
            No trips yet.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('RideTracking', { rideId: item._id })}
            style={{
              padding: spacing(1.5),
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: spacing(1),
            }}
          >
            <Text style={typography.h3}>
              {item.pickup.label} → {item.dropoff.label}
            </Text>
            <Text style={typography.caption}>
              {new Date(item.createdAt).toLocaleString()} • {item.status} • ${item.fare.toFixed(2)}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
