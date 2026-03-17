import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import Input from '../components/common/Input';
import GradientButton from '../components/common/GradientButton';
import Card from '../components/common/Card';

function SectionHeader({ title, icon }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { state, saveSettings } = useApp();
  const [settings, setSettings] = useState({ ...state.settings });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setSettings((s) => ({ ...s, [field]: value }));
  }

  function updateBank(field, value) {
    setSettings((s) => ({ ...s, bankDetails: { ...(s.bankDetails || {}), [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      Alert.alert('Error', 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, aspect: [4, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      update('logo', result.assets[0].uri);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Business configuration</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Business Identity */}
        <SectionHeader title="Business Identity" icon="🏢" />
        <Card>
          {settings.logo ? (
            <TouchableOpacity onPress={pickLogo} style={styles.logoWrap}>
              <Text style={styles.logoLabel}>Logo uploaded ✓</Text>
              <Text style={styles.logoChange}>Tap to change</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.logoUpload} onPress={pickLogo}>
              <Text style={styles.logoUploadIcon}>🖼</Text>
              <Text style={styles.logoUploadText}>Upload Logo</Text>
            </TouchableOpacity>
          )}
          <Input label="Business Name" value={settings.businessName || ''} onChangeText={(v) => update('businessName', v)} />
          <Input label="Brand Name" value={settings.brandName || ''} onChangeText={(v) => update('brandName', v)} />
          <Input label="Unit / Branch" value={settings.unit || ''} onChangeText={(v) => update('unit', v)} />
          <Input label="Address" value={settings.address || ''} onChangeText={(v) => update('address', v)} multiline numberOfLines={3} />
          <Input label="Phone" value={settings.phone || ''} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
          <Input label="Email" value={settings.email || ''} onChangeText={(v) => update('email', v)} keyboardType="email-address" />
        </Card>

        {/* Registration */}
        <SectionHeader title="Registration" icon="📋" />
        <Card>
          <Input label="Udyam / MSME Number" value={settings.udyamNumber || ''} onChangeText={(v) => update('udyamNumber', v)} />
          <Input label="GST Number" value={settings.gstNumber || ''} onChangeText={(v) => update('gstNumber', v)} placeholder="22AAAAA0000A1Z5" />
          <Input label="PAN" value={settings.pan || ''} onChangeText={(v) => update('pan', v)} placeholder="AAAAA0000A" />
          <Input label="Supplier State" value={settings.supplierState || ''} onChangeText={(v) => update('supplierState', v)} hint="Used for GST auto-calculation" />
        </Card>

        {/* Bank Details */}
        <SectionHeader title="Bank Details" icon="🏦" />
        <Card>
          <Input label="Account Name" value={settings.bankDetails?.accountName || ''} onChangeText={(v) => updateBank('accountName', v)} />
          <Input label="Account Number" value={settings.bankDetails?.accountNumber || ''} onChangeText={(v) => updateBank('accountNumber', v)} keyboardType="number-pad" />
          <Input label="IFSC Code" value={settings.bankDetails?.ifsc || ''} onChangeText={(v) => updateBank('ifsc', v)} />
          <Input label="Bank Name" value={settings.bankDetails?.bankName || ''} onChangeText={(v) => updateBank('bankName', v)} />
          <Input label="Branch" value={settings.bankDetails?.branch || ''} onChangeText={(v) => updateBank('branch', v)} />
        </Card>

        {/* Payment Links */}
        <SectionHeader title="Payment Links" icon="💳" />
        <Card>
          <Input label="UPI ID" value={settings.upiId || ''} onChangeText={(v) => update('upiId', v)} placeholder="name@paytm" />
          <Input label="Razorpay Link" value={settings.razorpayLink || ''} onChangeText={(v) => update('razorpayLink', v)} placeholder="https://rzp.io/l/..." />
          <Input label="Stripe Link" value={settings.stripeLink || ''} onChangeText={(v) => update('stripeLink', v)} placeholder="https://buy.stripe.com/..." />
        </Card>

        {/* Defaults */}
        <SectionHeader title="Defaults" icon="📄" />
        <Card>
          <Input
            label="Default Payment Terms"
            value={settings.defaultPaymentTerms || ''}
            onChangeText={(v) => update('defaultPaymentTerms', v)}
            multiline numberOfLines={3}
          />
          <Input
            label="Default Terms & Conditions"
            value={settings.defaultTerms || ''}
            onChangeText={(v) => update('defaultTerms', v)}
            multiline numberOfLines={5}
          />
          <Input
            label="Thank You Message"
            value={settings.thankYouNote || ''}
            onChangeText={(v) => update('thankYouNote', v)}
            multiline numberOfLines={2}
          />
        </Card>

        {/* Info Block */}
        <Card glass>
          <Text style={styles.infoTitle}>Pre-filled from Registration</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Udyam:</Text><Text style={styles.infoVal}>UDYAM-KR-26-0057710</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Type:</Text><Text style={styles.infoVal}>Micro Enterprise (Services)</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Industry:</Text><Text style={styles.infoVal}>Advertising, programming, consultancy</Text></View>
        </Card>

        <GradientButton
          label={saved ? '✓ Saved!' : 'Save Settings'}
          loading={saving}
          onPress={handleSave}
          style={styles.saveBtn}
          variant={saved ? 'success' : 'primary'}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    paddingBottom: 16, paddingHorizontal: spacing.xl,
  },
  headerTitle: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  scroll: { flex: 1, paddingHorizontal: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  logoWrap: {
    backgroundColor: colors.successBg, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  logoLabel: { fontSize: typography.md, color: colors.success, fontWeight: '700' },
  logoChange: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  logoUpload: {
    backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed', borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  logoUploadIcon: { fontSize: 32, marginBottom: spacing.sm },
  logoUploadText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  infoTitle: { fontSize: typography.sm, color: colors.accentPurple, fontWeight: '700', marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: 6 },
  infoLabel: { fontSize: typography.xs, color: colors.textDisabled, width: 80 },
  infoVal: { fontSize: typography.xs, color: colors.textSecondary, flex: 1 },
  saveBtn: { marginTop: spacing.xxl },
});
