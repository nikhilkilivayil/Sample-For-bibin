import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

export default function Button({ title, onPress, loading, disabled, variant = 'primary', style }) {
  const isDisabled = disabled || loading;
  const palette = {
    primary: { bg: colors.primary, fg: '#FFFFFF' },
    accent: { bg: colors.accent, fg: '#FFFFFF' },
    danger: { bg: colors.danger, fg: '#FFFFFF' },
    ghost: { bg: 'transparent', fg: colors.text, border: colors.border },
  }[variant] || { bg: colors.primary, fg: '#FFFFFF' };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border || palette.bg,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading && <ActivityIndicator color={palette.fg} style={{ marginRight: 8 }} />}
        <Text style={[typography.h3, { color: palette.fg }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing(1.75),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
