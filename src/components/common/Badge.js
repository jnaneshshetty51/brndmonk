import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, typography, spacing } from '../../constants/theme';

export default function Badge({ label, color = '#7c3aed', style }) {
  const bg = color + '22';
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '55' }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
