import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function StepIndicator({ steps, currentStep }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollWrap}
      contentContainerStyle={styles.container}
    >
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <React.Fragment key={i}>
            <View style={styles.stepItem}>
              {done || active ? (
                <LinearGradient
                  colors={[colors.accentPurple, colors.accentBlue]}
                  style={styles.circle}
                >
                  <Text style={styles.circleText}>{done ? '✓' : i + 1}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.circle, styles.circleInactive]}>
                  <Text style={[styles.circleText, { color: colors.textDisabled }]}>{i + 1}</Text>
                </View>
              )}
              <Text style={[styles.label, active && styles.labelActive, done && styles.labelDone]}>
                {step}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.line, (done) && styles.lineActive]} />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrap: { flexGrow: 0 },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  stepItem: {
    alignItems: 'center',
    width: 56,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInactive: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    color: colors.textDisabled,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  labelActive: { color: colors.accentPurple, fontWeight: '700' },
  labelDone: { color: colors.success },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginTop: 16,
    marginHorizontal: -8,
  },
  lineActive: { backgroundColor: colors.accentPurple },
});
