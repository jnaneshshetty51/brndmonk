import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { buildQuoteHTML, generateAndSharePDF } from '../../utils/pdfGenerator';
import { shareViaWhatsApp, buildQuoteWhatsAppMessage } from '../../utils/whatsapp';
import { formatCurrency } from '../../utils/formatters';
import { updateQuoteStatus, deleteQuote } from '../../firebase/quotes';
import { QUOTE_STATUSES } from '../../constants/defaults';
import Badge from '../../components/common/Badge';
import GradientButton from '../../components/common/GradientButton';

export default function QuotePreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { dispatch } = useApp();
  const { quote, draft } = route.params || {};
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  if (!quote) {
    navigation.goBack();
    return null;
  }

  const quoteHTML = buildQuoteHTML(quote);

  async function handleDownloadPDF() {
    setExporting(true);
    try {
      await generateAndSharePDF(quoteHTML, `Quote_${quote.quoteNumber}.pdf`);
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleWhatsApp() {
    const msg = buildQuoteWhatsAppMessage(quote);
    const phone = quote.client?.phone?.replace(/\D/g, '') || '';
    await shareViaWhatsApp(phone ? `91${phone}` : '', msg);
  }

  async function handleStatusChange(newStatus) {
    if (!quote.id) return;
    setStatusUpdating(true);
    try {
      await updateQuoteStatus(quote.id, newStatus);
      dispatch({ type: 'UPDATE_QUOTE', payload: { id: quote.id, status: newStatus } });
      Alert.alert('Updated', `Quote marked as ${newStatus}`);
    } catch (e) {
      Alert.alert('Error', 'Could not update status.');
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete Quote', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (quote.id) {
            await deleteQuote(quote.id);
            dispatch({ type: 'DELETE_QUOTE', payload: quote.id });
          }
          navigation.navigate('QuoteList');
        },
      },
    ]);
  }

  const statusInfo = QUOTE_STATUSES[quote.status] || QUOTE_STATUSES.draft;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quote.quoteNumber}</Text>
        <Badge label={statusInfo.label} color={statusInfo.color} />
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Client Summary */}
        <View style={styles.summaryCard}>
          <LinearGradient colors={[colors.accentPurple + '33', colors.accentBlue + '22']} style={styles.summaryGrad}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>CLIENT</Text>
                <Text style={styles.summaryName}>{quote.client?.name}</Text>
                {quote.client?.company ? <Text style={styles.summarySub}>{quote.client.company}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>TOTAL</Text>
                <Text style={styles.summaryTotal}>{formatCurrency(quote.pricing?.grandTotal || 0)}</Text>
              </View>
            </View>
            <View style={styles.summaryMeta}>
              <View>
                <Text style={styles.summaryMetaLabel}>Quote #</Text>
                <Text style={styles.summaryMetaVal}>{quote.quoteNumber}</Text>
              </View>
              <View>
                <Text style={styles.summaryMetaLabel}>Date</Text>
                <Text style={styles.summaryMetaVal}>{quote.date}</Text>
              </View>
              <View>
                <Text style={styles.summaryMetaLabel}>Services</Text>
                <Text style={styles.summaryMetaVal}>{quote.selectedServices?.length || 0}</Text>
              </View>
              {quote.client?.salesperson && (
                <View>
                  <Text style={styles.summaryMetaLabel}>By</Text>
                  <Text style={styles.summaryMetaVal}>{quote.client.salesperson}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {(quote.selectedServices || []).map((s) => (
            <View key={s.id} style={styles.serviceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{s.name}</Text>
                {s.selectedDuration > 1 && <Text style={styles.serviceDetail}>{s.selectedDuration} months</Text>}
                {s.selectedTier && <Text style={styles.serviceDetail}>{s.selectedTier} tier</Text>}
              </View>
              <Text style={styles.serviceAmt}>{formatCurrency(s.totalPrice || s.price || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Subtotal</Text>
              <Text style={styles.pricingVal}>{formatCurrency(quote.pricing?.subtotal || 0)}</Text>
            </View>
            {(quote.pricing?.discountAmount || 0) > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount</Text>
                <Text style={[styles.pricingVal, { color: colors.success }]}>
                  - {formatCurrency(quote.pricing.discountAmount)}
                </Text>
              </View>
            )}
            {(quote.pricing?.igst || 0) > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>IGST (18%)</Text>
                <Text style={styles.pricingVal}>{formatCurrency(quote.pricing.igst)}</Text>
              </View>
            )}
            {(quote.pricing?.cgst || 0) > 0 && (
              <>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>CGST (9%)</Text>
                  <Text style={styles.pricingVal}>{formatCurrency(quote.pricing.cgst)}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>SGST (9%)</Text>
                  <Text style={styles.pricingVal}>{formatCurrency(quote.pricing.sgst)}</Text>
                </View>
              </>
            )}
            <View style={[styles.pricingRow, styles.pricingGrand]}>
              <Text style={styles.pricingGrandLabel}>Grand Total</Text>
              <Text style={styles.pricingGrandVal}>{formatCurrency(quote.pricing?.grandTotal || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Status Update (only saved quotes) */}
        {quote.id && !draft && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusRow}>
              {Object.entries(QUOTE_STATUSES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.statusBtn, quote.status === key && { borderColor: val.color, backgroundColor: val.color + '22' }]}
                  onPress={() => handleStatusChange(key)}
                  disabled={statusUpdating}
                >
                  <Text style={[styles.statusBtnText, quote.status === key && { color: val.color }]}>{val.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Proposal Preview (WebView) */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.previewToggle} onPress={() => setShowPreview(!showPreview)}>
            <Text style={styles.previewToggleText}>{showPreview ? '▲ Hide Preview' : '▼ Show Proposal Preview'}</Text>
          </TouchableOpacity>
          {showPreview && (
            <View style={styles.webviewWrap}>
              <WebView source={{ html: quoteHTML }} style={styles.webview} scrollEnabled />
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <GradientButton label="Download PDF" icon="📥" loading={exporting} onPress={handleDownloadPDF} style={{ flex: 1 }} />
        <TouchableOpacity style={styles.actionOutline} onPress={handleWhatsApp}>
          <Text style={styles.actionOutlineText}>📱 WhatsApp</Text>
        </TouchableOpacity>
        {quote.id && (
          <TouchableOpacity style={styles.actionDanger} onPress={handleDelete}>
            <Text style={styles.actionDangerText}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, paddingHorizontal: spacing.xl,
  },
  backText: { color: colors.accentPurple, fontSize: typography.sm, fontWeight: '600' },
  headerTitle: { fontSize: typography.lg, fontWeight: '800', color: colors.textPrimary },
  scroll: { flex: 1 },
  summaryCard: { margin: spacing.xl, borderRadius: radius.xl, overflow: 'hidden' },
  summaryGrad: { padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.accentPurple + '33' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  summaryLabel: { fontSize: 10, color: colors.textDisabled, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  summaryName: { fontSize: typography.xl, fontWeight: '800', color: colors.textPrimary },
  summarySub: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  summaryTotal: { fontSize: typography.xxl, fontWeight: '800', color: colors.accentPurple },
  summaryMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryMetaLabel: { fontSize: 10, color: colors.textDisabled, letterSpacing: 1 },
  summaryMetaVal: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  serviceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  serviceName: { fontSize: typography.md, fontWeight: '600', color: colors.textPrimary },
  serviceDetail: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  serviceAmt: { fontSize: typography.md, fontWeight: '700', color: colors.accentPurple },
  pricingCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  pricingLabel: { fontSize: typography.sm, color: colors.textMuted },
  pricingVal: { fontSize: typography.sm, fontWeight: '600', color: colors.textPrimary },
  pricingGrand: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  pricingGrandLabel: { fontSize: typography.md, fontWeight: '700', color: colors.textPrimary },
  pricingGrandVal: { fontSize: typography.xl, fontWeight: '800', color: colors.accentPurple },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
  },
  statusBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  previewToggle: {
    backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: radius.lg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  previewToggleText: { fontSize: typography.sm, color: colors.accentPurple, fontWeight: '700' },
  webviewWrap: { height: 500, marginTop: spacing.md, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  webview: { flex: 1 },
  actions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: spacing.sm, padding: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  actionOutline: {
    paddingHorizontal: spacing.lg, paddingVertical: 14, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  actionOutlineText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '600' },
  actionDanger: {
    paddingHorizontal: spacing.lg, paddingVertical: 14, borderRadius: radius.lg,
    backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.error + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  actionDangerText: { fontSize: 18 },
});
