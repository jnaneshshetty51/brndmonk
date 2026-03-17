import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function GradientButton({
  onPress, label, icon, loading, variant = 'primary',
  size = 'md', style, textStyle, disabled,
}) {
  const gradients = {
    primary: [colors.accentPurple, colors.accentBlue],
    success: ['#059669', '#10b981'],
    danger: ['#dc2626', '#ef4444'],
    ghost: ['transparent', 'transparent'],
  };

  const sizes = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: typography.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: typography.md },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: typography.lg },
  };

  const sz = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.wrapper, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={[styles.label, { fontSize: sz.fontSize }, textStyle]}>
            {icon ? `${icon} ` : ''}{label}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
