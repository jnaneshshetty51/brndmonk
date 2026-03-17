import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function Input({
  label, value, onChangeText, placeholder, keyboardType,
  multiline, numberOfLines, editable = true,
  rightElement, hint, error, style,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrap,
        focused && styles.focused,
        error && styles.errorBorder,
        !editable && styles.disabled,
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && { minHeight: (numberOfLines || 3) * 22, textAlignVertical: 'top' }]}
        />
        {rightElement}
      </View>
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.md,
    paddingVertical: spacing.md,
  },
  focused: { borderColor: colors.accentPurple },
  errorBorder: { borderColor: colors.error },
  disabled: { opacity: 0.5 },
  hint: { fontSize: typography.xs, color: colors.textDisabled, marginTop: 4 },
  error: { fontSize: typography.xs, color: colors.error, marginTop: 4 },
});
