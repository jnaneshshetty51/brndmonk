import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { calculatePricing, suggestGSTType } from '../../utils/pricing';
import { formatCurrency, generateInvoiceNumber, formatDateISO, addDays } from '../../utils/formatters';
import { INDIAN_STATES, PAYMENT_TERMS_OPTIONS, CURRENCIES } from '../../constants/defaults';
import { saveInvoice } from '../../firebase/invoices';
import StepIndicator from '../../components/common/StepIndicator';
import GradientButton from '../../components/common/GradientButton';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const STEPS = ['Header', 'Client', 'Items', 'Pricing', 'Payment', 'Preview'];
const GST_TYPES = [
  { value: 'none', label: 'No GST' },
  { value: 'cgst_sgst', label: 'CGST + SGST (18%)' },
  { value: 'igst', label: 'IGST (18%)' },
];
const OTHER_CHARGE_TYPES = ['Setup Cost', 'Maintenance', 'Hosting', 'Ads Budget', 'Convenience Fee'];

export default function CreateInvoiceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const today = formatDateISO(new Date());
  const invoiceNumber = generateInvoiceNumber(state.invoiceCount);

  // Step 1 — Header
  const [header, setHeader] = useState({
    invoiceNumber,
    date: today,
    dueDate: formatDateISO(addDays(new Date(), 30)),
    paymentTermsDays: 30,
    paymentTermsLabel: 'Net 30 Days',
    currency: '₹',
    placeOfSupply: 'Karnataka',
    poNumber: '',
    projectName: '',
    salesperson: '',
  });

  // Step 2 — Client
  const [client, setClient] = useState({
    name: '', company: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '',
    gstNumber: '', pan: '',
    country: 'India',
    isInternational: false,
  });

  // Step 3 — Line Items
  const [lineItems, setLineItems] = useState([
    { id: Date.now(), name: '', description: '', sacCode: '', qty: '1', unit: '', rate: '', itemDiscount: '' },
  ]);

  // Step 4 — Pricing
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('0');
  const [gstType, setGstType] = useState('none');
  const [otherCharges, setOtherCharges] = useState([]);
  const [tdsPercent, setTdsPercent] = useState('0');

  // Step 5 — Payment
  const [payment, setPayment] = useState({
    accountName: state.settings?.bankDetails?.accountName || 'ASTRAVEDA',
    accountNumber: state.settings?.bankDetails?.accountNumber || '',
    ifsc: state.settings?.bankDetails?.ifsc || '',
    bankName: state.settings?.bankDetails?.bankName || '',
    branch: state.settings?.bankDetails?.branch || '',
    upiId: state.settings?.upiId || '',
    razorpayLink: state.settings?.razorpayLink || '',
    paymentTerms: state.settings?.defaultPaymentTerms || '50% advance to start. 50% after delivery.',
    termsText: state.settings?.defaultTerms || '',
    lateFeeEnabled: false,
  });

  // ---- Line Item helpers ----
  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now(), name: '', description: '', sacCode: '', qty: '1', unit: '', rate: '', itemDiscount: '' },
    ]);
  }

  function removeLineItem(id) {
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateLineItem(id, field, value) {
    setLineItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  function getItemAmount(item) {
    const gross = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    const disc = item.itemDiscount ? (gross * parseFloat(item.itemDiscount)) / 100 : 0;
    return gross - disc;
  }

  const lineSubtotal = lineItems.reduce((sum, i) => sum + getItemAmount(i), 0);
  const otherTotal = otherCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  // Auto-suggest GST
  const suggestedGST = suggestGSTType(client.state, 'Karnataka');

  const pricing = calculatePricing({
    subtotal: lineSubtotal,
    discountType,
    discountValue: parseFloat(discountValue) || 0,
    gstType,
    otherCharges: otherTotal,
    tdsPercent: parseFloat(tdsPercent) || 0,
  });

  function updatePaymentTerms(days, label) {
    const due = formatDateISO(addDays(new Date(header.date), days));
    setHeader((h) => ({ ...h, dueDate: due, paymentTermsDays: days, paymentTermsLabel: label }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const invoiceData = {
        header,
        client,
        lineItems,
        pricing,
        payment,
        status: 'draft',
        business: state.settings,
      };
      const id = await saveInvoice(invoiceData);
      const saved = { id, ...invoiceData };
      dispatch({ type: 'ADD_INVOICE', payload: saved });
      navigation.replace('InvoicePreview', { invoice: saved });
    } catch (e) {
      Alert.alert('Error', 'Could not save invoice. Check Firebase setup.');
    } finally {
      setSaving(false);
    }
  }

  function previewInvoice() {
    navigation.navigate('InvoicePreview', {
      invoice: { header, client, lineItems, pricing, payment, status: 'draft', business: state.settings },
      draft: true,
    });
  }

  function nextStep() {
    if (step === 1 && !client.name.trim()) {
      Alert.alert('Missing Info', 'Please enter client name.');
      return;
    }
    if (step === 2 && lineItems.some((i) => !i.name.trim())) {
      Alert.alert('Missing Info', 'All line items must have a name.');
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  // ---- Render steps ----
  function renderStep0() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Invoice Header</Text>
        <Card>
          <Input label="Invoice Number" value={header.invoiceNumber} onChangeText={(v) => setHeader({ ...header, invoiceNumber: v })} />
          <Input label="Invoice Date" value={header.date} onChangeText={(v) => setHeader({ ...header, date: v })} placeholder="YYYY-MM-DD" />

          <Text style={styles.fieldLabel}>Payment Terms</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            {PAYMENT_TERMS_OPTIONS.map((pt) => (
              <TouchableOpacity
                key={pt.value}
                style={[styles.termBtn, header.paymentTermsDays === pt.value && styles.termBtnActive]}
                onPress={() => updatePaymentTerms(pt.value, pt.label)}
              >
                <Text style={[styles.termBtnText, header.paymentTermsDays === pt.value && styles.termBtnTextActive]}>{pt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input label="Due Date" value={header.dueDate} onChangeText={(v) => setHeader({ ...header, dueDate: v })} hint="Auto-calculated from payment terms" />

          <Text style={styles.fieldLabel}>Currency</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.slice(0, 3).map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[styles.currBtn, header.currency === c.symbol && styles.currBtnActive]}
                onPress={() => setHeader({ ...header, currency: c.symbol })}
              >
                <Text style={[styles.currBtnText, header.currency === c.symbol && styles.currBtnTextActive]}>
                  {c.symbol} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Place of Supply</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            {['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Gujarat'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.termBtn, header.placeOfSupply === s && styles.termBtnActive]}
                onPress={() => setHeader({ ...header, placeOfSupply: s })}
              >
                <Text style={[styles.termBtnText, header.placeOfSupply === s && styles.termBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        <Card>
          <Text style={styles.fieldLabelSm}>OPTIONAL</Text>
          <Input label="PO Number" value={header.poNumber} onChangeText={(v) => setHeader({ ...header, poNumber: v })} placeholder="PO-2026-001" />
          <Input label="Project Name" value={header.projectName} onChangeText={(v) => setHeader({ ...header, projectName: v })} placeholder="Website Redesign" />
          <Input label="Salesperson" value={header.salesperson} onChangeText={(v) => setHeader({ ...header, salesperson: v })} placeholder="Your name" />
        </Card>
      </ScrollView>
    );
  }

  function renderStep1() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Client Details</Text>
        <Card>
          <Input label="Client Name *" value={client.name} onChangeText={(v) => setClient({ ...client, name: v })} placeholder="John Doe" />
          <Input label="Company Name" value={client.company} onChangeText={(v) => setClient({ ...client, company: v })} placeholder="Acme Corp" />
          <Input label="Email" value={client.email} onChangeText={(v) => setClient({ ...client, email: v })} keyboardType="email-address" placeholder="john@company.com" />
          <Input label="Phone" value={client.phone} onChangeText={(v) => setClient({ ...client, phone: v })} keyboardType="phone-pad" />
          <Input label="Billing Address" value={client.address} onChangeText={(v) => setClient({ ...client, address: v })} multiline numberOfLines={2} />
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Input label="City" value={client.city} onChangeText={(v) => setClient({ ...client, city: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Pincode" value={client.pincode} onChangeText={(v) => setClient({ ...client, pincode: v })} keyboardType="number-pad" />
            </View>
          </View>

          <Text style={styles.fieldLabel}>State</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            {['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Gujarat', 'Telangana', 'Kerala', 'Other'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.termBtn, client.state === s && styles.termBtnActive]}
                onPress={() => setClient({ ...client, state: s })}
              >
                <Text style={[styles.termBtnText, client.state === s && styles.termBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {client.state && client.state !== 'Karnataka' && (
            <View style={styles.gstSuggestion}>
              <Text style={styles.gstSuggestionText}>
                ℹ️ Client is in {client.state} → IGST recommended
              </Text>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.fieldLabelSm}>GST DETAILS</Text>
          <Input label="GST Number" value={client.gstNumber} onChangeText={(v) => setClient({ ...client, gstNumber: v })} placeholder="22AAAAA0000A1Z5" />
          <Input label="PAN (Optional)" value={client.pan} onChangeText={(v) => setClient({ ...client, pan: v })} placeholder="AAAAA0000A" />
        </Card>
      </ScrollView>
    );
  }

  function renderStep2() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Line Items</Text>
        {lineItems.map((item, idx) => (
          <Card key={item.id}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNum}>Item {idx + 1}</Text>
              {lineItems.length > 1 && (
                <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                  <Text style={styles.removeBtn}>✕ Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Input label="Service Name *" value={item.name} onChangeText={(v) => updateLineItem(item.id, 'name', v)} placeholder="Social Media Marketing" />
            <Input label="Description" value={item.description} onChangeText={(v) => updateLineItem(item.id, 'description', v)} placeholder="3 months management" multiline numberOfLines={2} />
            <Input label="SAC/HSN Code" value={item.sacCode} onChangeText={(v) => updateLineItem(item.id, 'sacCode', v)} placeholder="998363" keyboardType="number-pad" />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input label="Quantity" value={item.qty} onChangeText={(v) => updateLineItem(item.id, 'qty', v)} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Unit" value={item.unit} onChangeText={(v) => updateLineItem(item.id, 'unit', v)} placeholder="months / hrs" />
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input label="Rate (₹)" value={item.rate} onChangeText={(v) => updateLineItem(item.id, 'rate', v)} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Item Discount %" value={item.itemDiscount} onChangeText={(v) => updateLineItem(item.id, 'itemDiscount', v)} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.itemTotal}>
              <Text style={styles.itemTotalLabel}>Amount</Text>
              <Text style={styles.itemTotalVal}>{formatCurrency(getItemAmount(item))}</Text>
            </View>
          </Card>
        ))}

        <TouchableOpacity style={styles.addItemBtn} onPress={addLineItem}>
          <Text style={styles.addItemText}>+ Add Line Item</Text>
        </TouchableOpacity>

        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Items Subtotal</Text>
          <Text style={styles.subtotalVal}>{formatCurrency(lineSubtotal)}</Text>
        </View>
      </ScrollView>
    );
  }

  function renderStep3() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Pricing & Tax</Text>

        {/* Discount */}
        <Card>
          <Text style={styles.fieldLabel}>Overall Discount</Text>
          <View style={styles.toggleRow}>
            {['percent', 'flat'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, discountType === t && styles.toggleBtnActive]}
                onPress={() => setDiscountType(t)}
              >
                <Text style={[styles.toggleBtnText, discountType === t && styles.toggleBtnTextActive]}>
                  {t === 'percent' ? '% Percent' : '₹ Flat'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input value={discountValue} onChangeText={setDiscountValue} keyboardType="decimal-pad" placeholder="0" />
        </Card>

        {/* GST */}
        <Card>
          <Text style={styles.fieldLabel}>GST Type</Text>
          {client.state && client.state !== 'Karnataka' && (
            <TouchableOpacity style={styles.gstSuggestion} onPress={() => setGstType('igst')}>
              <Text style={styles.gstSuggestionText}>⚡ Tap to apply: IGST recommended for {client.state}</Text>
            </TouchableOpacity>
          )}
          {GST_TYPES.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[styles.gstOption, gstType === value && styles.gstOptionActive]}
              onPress={() => setGstType(value)}
            >
              <View style={[styles.radio, gstType === value && styles.radioActive]} />
              <Text style={[styles.gstOptionText, gstType === value && styles.gstOptionTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Other Charges */}
        <Card>
          <Text style={styles.fieldLabel}>Other Charges</Text>
          {otherCharges.map((c, i) => (
            <View key={i} style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.otherChargeType}>{c.type}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Input value={c.amount} onChangeText={(v) => {
                  const updated = [...otherCharges];
                  updated[i] = { ...c, amount: v };
                  setOtherCharges(updated);
                }} keyboardType="decimal-pad" placeholder="0" />
              </View>
            </View>
          ))}
          <View style={styles.otherTypesRow}>
            {OTHER_CHARGE_TYPES.filter((t) => !otherCharges.find((c) => c.type === t)).map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.otherTypeChip}
                onPress={() => setOtherCharges([...otherCharges, { type: t, amount: '' }])}
              >
                <Text style={styles.otherTypeChipText}>+ {t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* TDS */}
        <Card>
          <Input
            label="TDS Deduction %"
            value={tdsPercent}
            onChangeText={setTdsPercent}
            keyboardType="decimal-pad"
            placeholder="0"
            hint="Leave 0 if TDS is not applicable"
          />
        </Card>

        {/* Grand Total */}
        <LinearGradient colors={[colors.accentPurple, colors.accentBlue]} style={styles.totalCard}>
          <View style={styles.totalRow}><Text style={styles.totalRowLabel}>Subtotal</Text><Text style={styles.totalRowVal}>{formatCurrency(pricing.subtotal)}</Text></View>
          {pricing.discountAmount > 0 && <View style={styles.totalRow}><Text style={styles.totalRowLabel}>Discount</Text><Text style={[styles.totalRowVal, { color: '#86efac' }]}>- {formatCurrency(pricing.discountAmount)}</Text></View>}
          {otherTotal > 0 && <View style={styles.totalRow}><Text style={styles.totalRowLabel}>Other Charges</Text><Text style={styles.totalRowVal}>{formatCurrency(otherTotal)}</Text></View>}
          {pricing.cgst > 0 && <>
            <View style={styles.totalRow}><Text style={styles.totalRowLabel}>CGST (9%)</Text><Text style={styles.totalRowVal}>{formatCurrency(pricing.cgst)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalRowLabel}>SGST (9%)</Text><Text style={styles.totalRowVal}>{formatCurrency(pricing.sgst)}</Text></View>
          </>}
          {pricing.igst > 0 && <View style={styles.totalRow}><Text style={styles.totalRowLabel}>IGST (18%)</Text><Text style={styles.totalRowVal}>{formatCurrency(pricing.igst)}</Text></View>}
          {pricing.tdsAmount > 0 && <View style={styles.totalRow}><Text style={styles.totalRowLabel}>TDS Deduction</Text><Text style={[styles.totalRowVal, { color: '#fca5a5' }]}>- {formatCurrency(pricing.tdsAmount)}</Text></View>}
          <View style={[styles.totalRow, styles.totalRowGrand]}>
            <Text style={styles.grandLabel}>GRAND TOTAL</Text>
            <Text style={styles.grandValue}>{formatCurrency(pricing.grandTotal)}</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    );
  }

  function renderStep4() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Payment Info</Text>
        <Card>
          <Text style={styles.fieldLabelSm}>BANK DETAILS</Text>
          <Input label="Account Name" value={payment.accountName} onChangeText={(v) => setPayment({ ...payment, accountName: v })} />
          <Input label="Account Number" value={payment.accountNumber} onChangeText={(v) => setPayment({ ...payment, accountNumber: v })} keyboardType="number-pad" />
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Input label="IFSC Code" value={payment.ifsc} onChangeText={(v) => setPayment({ ...payment, ifsc: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Bank Name" value={payment.bankName} onChangeText={(v) => setPayment({ ...payment, bankName: v })} />
            </View>
          </View>
          <Input label="Branch" value={payment.branch} onChangeText={(v) => setPayment({ ...payment, branch: v })} />
        </Card>

        <Card>
          <Text style={styles.fieldLabelSm}>UPI & ONLINE</Text>
          <Input label="UPI ID" value={payment.upiId} onChangeText={(v) => setPayment({ ...payment, upiId: v })} placeholder="name@upi" />
          <Input label="Razorpay Link" value={payment.razorpayLink} onChangeText={(v) => setPayment({ ...payment, razorpayLink: v })} placeholder="https://rzp.io/..." />
        </Card>

        <Card>
          <Input
            label="Payment Terms"
            value={payment.paymentTerms}
            onChangeText={(v) => setPayment({ ...payment, paymentTerms: v })}
            multiline
            numberOfLines={3}
            placeholder="e.g. 50% advance, 50% on delivery"
          />
          <Input
            label="Terms & Conditions"
            value={payment.termsText}
            onChangeText={(v) => setPayment({ ...payment, termsText: v })}
            multiline
            numberOfLines={5}
            placeholder="Standard terms and conditions..."
          />
        </Card>
      </ScrollView>
    );
  }

  function renderStep5() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Ready to Invoice!</Text>
        <Text style={styles.stepSub}>Review and export your invoice</Text>

        <Card glass>
          <Text style={styles.reviewLabel}>CLIENT</Text>
          <Text style={styles.reviewValue}>{client.name}</Text>
          {client.company ? <Text style={styles.reviewSub}>{client.company}</Text> : null}
          {client.gstNumber ? <Text style={styles.reviewSub}>GST: {client.gstNumber}</Text> : null}

          <View style={styles.reviewDivider} />
          <Text style={styles.reviewLabel}>INVOICE</Text>
          <Text style={styles.reviewValue}>{header.invoiceNumber}</Text>
          <Text style={styles.reviewSub}>{header.date} → Due: {header.dueDate}</Text>

          <View style={styles.reviewDivider} />
          <Text style={styles.reviewLabel}>LINE ITEMS ({lineItems.length})</Text>
          {lineItems.map((item, i) => (
            <View key={item.id} style={styles.reviewServiceRow}>
              <Text style={styles.reviewServiceName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.reviewServicePrice}>{formatCurrency(getItemAmount(item))}</Text>
            </View>
          ))}

          <View style={styles.reviewDivider} />
          <Text style={styles.reviewLabel}>GRAND TOTAL</Text>
          <Text style={styles.reviewTotal}>{formatCurrency(pricing.grandTotal)}</Text>
        </Card>

        <GradientButton label="Preview Invoice" icon="👁" onPress={previewInvoice} style={styles.actionBtn2} />
        <GradientButton label="Save Invoice" icon="💾" loading={saving} onPress={handleSave} style={styles.actionBtn2} />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>New Invoice</Text>
          <Text style={styles.topBarNum}>{invoiceNumber}</Text>
        </LinearGradient>

        <StepIndicator steps={STEPS} currentStep={step} />

        <View style={styles.content}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </View>

        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
          {step > 0 && (
            <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
              <Text style={styles.prevBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 && (
            <GradientButton label="Continue →" onPress={nextStep} style={{ flex: 1 }} />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, paddingHorizontal: spacing.xl,
  },
  backText: { color: colors.accentPurple, fontSize: typography.sm, fontWeight: '600' },
  topBarTitle: { fontSize: typography.lg, fontWeight: '800', color: colors.textPrimary },
  topBarNum: { fontSize: typography.xs, color: colors.textMuted },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  stepTitle: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: 4, marginTop: spacing.md },
  stepSub: { fontSize: typography.sm, color: colors.textMuted, marginBottom: spacing.xl },
  fieldLabel: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600', marginBottom: spacing.md },
  fieldLabelSm: { fontSize: 10, color: colors.accentPurple, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.md },
  termBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, marginRight: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSecondary,
  },
  termBtnActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  termBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  termBtnTextActive: { color: colors.accentPurple, fontWeight: '700' },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  currBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSecondary,
  },
  currBtnActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  currBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  currBtnTextActive: { color: colors.accentPurple, fontWeight: '700' },
  twoCol: { flexDirection: 'row', gap: spacing.md },
  gstSuggestion: {
    backgroundColor: colors.infoBg, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  gstSuggestionText: { fontSize: typography.xs, color: colors.accentBlue, fontWeight: '600' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  itemNum: { fontSize: typography.sm, fontWeight: '700', color: colors.accentPurple },
  removeBtn: { fontSize: typography.xs, color: colors.error, fontWeight: '600' },
  itemTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md,
  },
  itemTotalLabel: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  itemTotalVal: { fontSize: typography.lg, fontWeight: '800', color: colors.accentPurple },
  addItemBtn: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.accentPurple + '44',
    borderStyle: 'dashed', borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addItemText: { fontSize: typography.md, color: colors.accentPurple, fontWeight: '700' },
  subtotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
  },
  subtotalLabel: { fontSize: typography.md, fontWeight: '700', color: colors.textPrimary },
  subtotalVal: { fontSize: typography.lg, fontWeight: '800', color: colors.accentPurple },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  toggleBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  toggleBtnTextActive: { color: colors.accentPurple, fontWeight: '700' },
  gstOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  gstOptionActive: {},
  radio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: colors.border,
  },
  radioActive: { borderColor: colors.accentPurple, backgroundColor: colors.accentPurple },
  gstOptionText: { fontSize: typography.md, color: colors.textMuted, fontWeight: '500' },
  gstOptionTextActive: { color: colors.textPrimary, fontWeight: '700' },
  otherChargeType: { fontSize: typography.sm, color: colors.textSecondary, paddingTop: 32, fontWeight: '600' },
  otherTypesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  otherTypeChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border,
  },
  otherTypeChipText: { fontSize: typography.xs, color: colors.accentBlue, fontWeight: '600' },
  totalCard: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalRowLabel: { fontSize: typography.sm, color: 'rgba(255,255,255,0.7)' },
  totalRowVal: { fontSize: typography.sm, fontWeight: '600', color: colors.white },
  totalRowGrand: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  grandLabel: { fontSize: typography.sm, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  grandValue: { fontSize: typography.xxl, fontWeight: '800', color: colors.white },
  reviewLabel: { fontSize: 10, color: colors.textDisabled, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  reviewValue: { fontSize: typography.xl, fontWeight: '800', color: colors.textPrimary },
  reviewSub: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  reviewDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  reviewServiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewServiceName: { fontSize: typography.sm, color: colors.textSecondary, flex: 1 },
  reviewServicePrice: { fontSize: typography.sm, fontWeight: '700', color: colors.textPrimary },
  reviewTotal: { fontSize: typography.xxxl, fontWeight: '800', color: colors.accentPurple, marginTop: 4 },
  actionBtn2: { marginBottom: spacing.md },
  bottomNav: {
    flexDirection: 'row', gap: spacing.md, padding: spacing.xl,
    paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  prevBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: 14, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  prevBtnText: { color: colors.textMuted, fontSize: typography.md, fontWeight: '600' },
});
