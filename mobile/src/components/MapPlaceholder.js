import React from 'react';
import { View, Text, Platform } from 'react-native';
import { colors, radius, typography } from '../utils/theme';

let MapView = null;
let Marker = null;
try {
  if (Platform.OS !== 'web') {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  }
} catch (_e) {
  MapView = null;
}

export default function MapPlaceholder({ region, markers = [], style, children }) {
  if (MapView && region) {
    return (
      <MapView style={[{ flex: 1, borderRadius: radius.md }, style]} region={region}>
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.title}
            description={m.description}
            pinColor={m.color}
          />
        ))}
        {children}
      </MapView>
    );
  }

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        },
        style,
      ]}
    >
      <Text style={[typography.h3, { marginBottom: 6 }]}>Map preview</Text>
      <Text style={[typography.caption, { textAlign: 'center' }]}>
        {region
          ? `Centered on ${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`
          : 'Waiting for location…'}
      </Text>
      {markers.length > 0 && (
        <Text style={[typography.caption, { marginTop: 8 }]}>
          {markers.length} pin{markers.length > 1 ? 's' : ''} on map
        </Text>
      )}
    </View>
  );
}
