import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Alert, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { buildInvoiceHTML, generateAndSharePDF } from '../../utils/pdfGenerator';
import { shareViaWhatsApp, buildInvoiceWhatsAppMessage } from '../../utils/whatsapp';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { updateInvoiceStatus, recordPayment, deleteInvoice } from '../../firebase/invoices';
import { INVOICE_STATUSES } from '../../constants/defaults';
import Badge from '../../components/common/Badge';
import GradientButton from '../../components/common/GradientButton';

export default function InvoicePreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { dispatch } = useApp();
  const { invoice, draft } = route.params || {};
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmt, setPaymentAmt] = useState('');

  if (!invoice) { navigation.goBack(); return null; }

  const invoiceHTML = buildInvoiceHTML(invoice);
  const statusInfo = INVOICE_STATUSES[invoice.status] || INVOICE_STATUSES.draft;
  const paidSoFar = invoice.paidAmount || 0;
  const totalAmt = invoice.pricing?.grandTotal || 0;
  const pendingAmt = totalAmt - paidSoFar;

  async function handleDownloadPDF() {
    setExporting(true);
    try {
      await generateAndSharePDF(invoiceHTML, `Invoice_${invoice.header?.invoiceNumber}.pdf`);
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF.');
    } finally {
      setExporting(false);
    }
  }

  async function handleWhatsApp() {
    const msg = buildInvoiceWhatsAppMessage(invoice);
    const phone = invoice.client?.phone?.replace(/\D/g, '') || '';
    await shareViaWhatsApp(phone ? `91${phone}` : '', msg);
  }

  async function handleStatusChange(newStatus) {
    if (!invoice.id) return;
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      dispatch({ type: 'UPDATE_INVOICE', payload: { id: invoice.id, status: newStatus } });
    } catch (_) { Alert.alert('Error', 'Could not update status.'); }
  }

  async function handleRecordPayment() {
    if (!invoice.id || !paymentAmt) return;
    try {
      await recordPayment(invoice.id, parseFloat(paymentAmt), totalAmt);
      dispatch({ type: 'UPDATE_INVOICE', payload: {
        id: invoice.id,
        paidAmount: parseFloat(paymentAmt),
        status: parseFloat(paymentAmt) >= totalAmt ? 'paid' : 'partial',
      }});
      setShowPayment(false);
      setPaymentAmt('');
      Alert.alert('Payment Recorded', `₹${paymentAmt} recorded successfully.`);
    } catch (_) { Alert.alert('Error', 'Could not record payment.'); }
  }

  async function handleDelete() {
    Alert.alert('Delete Invoice', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (invoice.id) {
            await deleteInvoice(invoice.id);
            dispatch({ type: 'DELETE_INVOICE', payload: invoice.id });
          }
          navigation.navigate('InvoiceList');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{invoice.header?.invoiceNumber}</Text>
        <Badge label={statusInfo.label} color={statusInfo.color} />
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <LinearGradient colors={[colors.accentPurple + '33', colors.accentBlue + '22']} style={styles.summaryGrad}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>BILL TO</Text>
                <Text style={styles.summaryName}>{invoice.client?.name}</Text>
                {invoice.client?.company ? <Text style={styles.summarySub}>{invoice.client.company}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>TOTAL</Text>
                <Text style={styles.summaryTotal}>{formatCurrency(totalAmt)}</Text>
              </View>
            </View>
            <View style={styles.summaryMeta}>
              <View>
                <Text style={styles.summaryMetaLabel}>Invoice</Text>
                <Text style={styles.summaryMetaVal}>{invoice.header?.invoiceNumber}</Text>
              </View>
              <View>
                <Text style={styles.summaryMetaLabel}>Date</Text>
                <Text style={styles.summaryMetaVal}>{formatDate(invoice.header?.date)}</Text>
              </View>
              <View>
                <Text style={styles.summaryMetaLabel}>Due</Text>
                <Text style={styles.summaryMetaVal}>{formatDate(invoice.header?.dueDate)}</Text>
              </View>
              <View>
                <Text style={styles.summaryMetaLabel}>Terms</Text>
                <Text style={styles.summaryMetaVal}>{invoice.header?.paymentTermsLabel || '—'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Payment tracking */}
        {invoice.id && !draft && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Tracking</Text>
            <View style={styles.payTrack}>
              <View>
                <Text style={styles.payLabel}>Paid</Text>
                <Text style={styles.payVal}>{formatCurrency(paidSoFar)}</Text>
              </View>
              <View>
                <Text style={styles.payLabel}>Pending</Text>
                <Text style={[styles.payVal, { color: colors.warning }]}>{formatCurrency(Math.max(pendingAmt, 0))}</Text>
              </View>
              <View>
                <Text style={styles.payLabel}>Total</Text>
                <Text style={styles.payVal}>{formatCurrency(totalAmt)}</Text>
              </View>
            </View>

            {pendingAmt > 0 && (
              <TouchableOpacity style={styles.recordPayBtn} onPress={() => setShowPayment(!showPayment)}>
                <Text style={styles.recordPayText}>+ Record Payment</Text>
              </TouchableOpacity>
            )}

            {showPayment && (
              <View style={styles.paymentEntry}>
                <TextInput
                  style={styles.paymentInput}
                  placeholder="Amount received (₹)"
                  placeholderTextColor={colors.textDisabled}
                  value={paymentAmt}
                  onChangeText={setPaymentAmt}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.paymentConfirm} onPress={handleRecordPayment}>
                  <Text style={styles.paymentConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Line items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {(invoice.lineItems || []).map((item, i) => {
            const gross = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
            const disc = item.itemDiscount ? (gross * parseFloat(item.itemDiscount)) / 100 : 0;
            const net = gross - disc;
            return (
              <View key={i} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineItemName}>{item.name}</Text>
                  {item.description ? <Text style={styles.lineItemDesc}>{item.description}</Text> : null}
                  <Text style={styles.lineItemMeta}>
                    {item.qty} {item.unit} × {formatCurrency(item.rate)}
                    {item.itemDiscount ? ` − ${item.itemDiscount}%` : ''}
                  </Text>
                  {item.sacCode ? <Text style={styles.lineItemMeta}>SAC: {item.sacCode}</Text> : null}
                </View>
                <Text style={styles.lineItemAmt}>{formatCurrency(net)}</Text>
              </View>
            );
          })}
        </View>

        {/* Pricing breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingCard}>
            {[
              { label: 'Subtotal', val: invoice.pricing?.subtotal },
              invoice.pricing?.discountAmount > 0 && { label: 'Discount', val: -invoice.pricing.discountAmount },
              invoice.pricing?.otherCharges > 0 && { label: 'Other Charges', val: invoice.pricing.otherCharges },
              invoice.pricing?.cgst > 0 && { label: 'CGST (9%)', val: invoice.pricing.cgst },
              invoice.pricing?.sgst > 0 && { label: 'SGST (9%)', val: invoice.pricing.sgst },
              invoice.pricing?.igst > 0 && { label: 'IGST (18%)', val: invoice.pricing.igst },
              invoice.pricing?.tdsAmount > 0 && { label: 'TDS Deduction', val: -invoice.pricing.tdsAmount },
            ].filter(Boolean).map(({ label, val }) => (
              <View key={label} style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>{label}</Text>
                <Text style={[styles.pricingVal, val < 0 && { color: colors.success }]}>
                  {val < 0 ? `- ${formatCurrency(Math.abs(val))}` : formatCurrency(val || 0)}
                </Text>
              </View>
            ))}
            <View style={[styles.pricingRow, styles.pricingGrand]}>
              <Text style={styles.pricingGrandLabel}>Grand Total</Text>
              <Text style={styles.pricingGrandVal}>{formatCurrency(totalAmt)}</Text>
            </View>
          </View>
        </View>

        {/* Status */}
        {invoice.id && !draft && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusRow}>
              {Object.entries(INVOICE_STATUSES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.statusBtn, invoice.status === key && { borderColor: val.color, backgroundColor: val.color + '22' }]}
                  onPress={() => handleStatusChange(key)}
                >
                  <Text style={[styles.statusBtnText, invoice.status === key && { color: val.color }]}>{val.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* HTML Preview */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.previewToggle} onPress={() => setShowPreview(!showPreview)}>
            <Text style={styles.previewToggleText}>{showPreview ? '▲ Hide Preview' : '▼ Show Invoice Preview'}</Text>
          </TouchableOpacity>
          {showPreview && (
            <View style={styles.webviewWrap}>
              <WebView source={{ html: invoiceHTML }} style={styles.webview} scrollEnabled />
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <GradientButton label="Download PDF" icon="📥" loading={exporting} onPress={handleDownloadPDF} style={{ flex: 1 }} />
        <TouchableOpacity style={styles.actionOutline} onPress={handleWhatsApp}>
          <Text style={styles.actionOutlineText}>📱 WA</Text>
        </TouchableOpacity>
        {invoice.id && (
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
  summaryMeta: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  summaryMetaLabel: { fontSize: 10, color: colors.textDisabled, letterSpacing: 1 },
  summaryMetaVal: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  payTrack: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  payLabel: { fontSize: typography.xs, color: colors.textMuted, marginBottom: 4 },
  payVal: { fontSize: typography.xl, fontWeight: '800', color: colors.success },
  recordPayBtn: {
    backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.success + '44',
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
  },
  recordPayText: { fontSize: typography.sm, color: colors.success, fontWeight: '700' },
  paymentEntry: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  paymentInput: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.lg, color: colors.textPrimary, fontSize: typography.md,
  },
  paymentConfirm: {
    backgroundColor: colors.accentPurple, borderRadius: radius.md, paddingHorizontal: spacing.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentConfirmText: { color: colors.white, fontWeight: '700' },
  lineItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  lineItemName: { fontSize: typography.md, fontWeight: '700', color: colors.textPrimary },
  lineItemDesc: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  lineItemMeta: { fontSize: typography.xs, color: colors.textDisabled, marginTop: 2 },
  lineItemAmt: { fontSize: typography.md, fontWeight: '800', color: colors.accentPurple, marginTop: 2 },
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
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  statusBtnText: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '600' },
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
