import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

export default function Input({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: spacing(1.5) }, style]}>
      {label ? <Text style={[typography.caption, { marginBottom: 4 }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(1.75),
    fontSize: 16,
    color: colors.text,
  },
  err: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
