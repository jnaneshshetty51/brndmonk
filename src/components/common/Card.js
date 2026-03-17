import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export default function Card({ children, style, glass }) {
  return (
    <View style={[styles.card, glass && styles.glass, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  glass: {
    backgroundColor: colors.glass,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
