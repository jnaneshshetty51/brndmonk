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
import { SERVICES, SERVICE_CATEGORIES, QUICK_PACKAGES } from '../../constants/services';
import { calculatePricing, getServiceTotal, detectPackageSuggestion, getUpsellSuggestions } from '../../utils/pricing';
import { formatCurrency, generateQuoteNumber, formatDateISO } from '../../utils/formatters';
import { INDIAN_STATES } from '../../constants/defaults';
import { saveQuote } from '../../firebase/quotes';
import StepIndicator from '../../components/common/StepIndicator';
import GradientButton from '../../components/common/GradientButton';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const STEPS = ['Client', 'Services', 'Pricing', 'Preview'];
const PROJECT_TYPES = ['Digital Marketing', 'Web Development', 'App Development', 'Automation & AI', 'Full Package'];
const DURATIONS = [1, 3, 6, 12];

export default function CreateQuoteScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [client, setClient] = useState({
    name: '', company: '', phone: '', email: '', location: '', projectType: PROJECT_TYPES[0], salesperson: '',
  });

  // Step 2 state
  const [activeCat, setActiveCat] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);

  // Step 3 state
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('0');
  const [gstType, setGstType] = useState('none');

  const quoteNumber = generateQuoteNumber(state.quoteCount);
  const today = formatDateISO(new Date());

  // --- Service helpers ---
  function isSelected(serviceId) {
    return selectedServices.some((s) => s.id === serviceId);
  }

  function toggleService(service) {
    if (isSelected(service.id)) {
      setSelectedServices((prev) => prev.filter((s) => s.id !== service.id));
    } else {
      const entry = {
        ...service,
        price: service.tiers ? service.tiers['Basic'].price : (service.setupCost || service.basePrice || 0),
        setupCost: service.setupCost || 0,
        monthlyCost: service.monthlyCost || 0,
        selectedDuration: 1,
        selectedTier: service.tiers ? 'Basic' : null,
        tierPrice: service.tiers ? service.tiers['Basic'].price : 0,
        deliverables: service.tiers ? service.deliverables?.['Basic'] : service.deliverables,
      };
      entry.totalPrice = getServiceTotal(entry);
      setSelectedServices((prev) => [...prev, entry]);
    }
  }

  function updateService(serviceId, updates) {
    setSelectedServices((prev) => prev.map((s) => {
      if (s.id !== serviceId) return s;
      const updated = { ...s, ...updates };
      if (updates.selectedTier && s.tiers) {
        updated.tierPrice = s.tiers[updates.selectedTier].price;
        updated.deliverables = s.deliverables?.[updates.selectedTier] || [];
      }
      updated.totalPrice = getServiceTotal(updated);
      return updated;
    }));
  }

  // --- Pricing ---
  const subtotal = selectedServices.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
  const pricing = calculatePricing({
    subtotal,
    discountType,
    discountValue: parseFloat(discountValue) || 0,
    gstType,
  });

  const suggestion = detectPackageSuggestion(selectedServices.map((s) => s.id));
  const upsells = getUpsellSuggestions(selectedServices.map((s) => s.id));

  function applyPackage(pkg) {
    const services = [];
    pkg.services.forEach((sid) => {
      for (const cat of Object.values(SERVICES)) {
        const found = cat.find((s) => s.id === sid);
        if (found) {
          const entry = {
            ...found,
            price: found.tiers ? found.tiers['Basic'].price : (found.setupCost || found.basePrice || 0),
            setupCost: found.setupCost || 0,
            monthlyCost: found.monthlyCost || 0,
            selectedDuration: 3,
            selectedTier: found.tiers ? 'Basic' : null,
            tierPrice: found.tiers ? found.tiers['Basic'].price : 0,
            deliverables: found.tiers ? found.deliverables?.['Basic'] : found.deliverables,
          };
          entry.totalPrice = getServiceTotal(entry);
          services.push(entry);
        }
      }
    });
    setSelectedServices(services);
  }

  // --- Navigation ---
  function nextStep() {
    if (step === 0 && !client.name.trim()) {
      Alert.alert('Missing Info', 'Please enter client name.');
      return;
    }
    if (step === 1 && selectedServices.length === 0) {
      Alert.alert('No Services', 'Please select at least one service.');
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const quoteData = {
        quoteNumber,
        date: today,
        client: { ...client },
        selectedServices,
        pricing,
        status: 'draft',
        business: state.settings,
      };
      const id = await saveQuote(quoteData);
      const saved = { id, ...quoteData };
      dispatch({ type: 'ADD_QUOTE', payload: saved });
      navigation.replace('QuotePreview', { quote: saved });
    } catch (e) {
      Alert.alert('Error', 'Could not save quote. Check Firebase setup.');
    } finally {
      setSaving(false);
    }
  }

  function previewQuote() {
    navigation.navigate('QuotePreview', {
      quote: { quoteNumber, date: today, client, selectedServices, pricing, status: 'draft', business: state.settings },
      draft: true,
    });
  }

  // --- Renders ---
  function renderStep1() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Client Details</Text>
        <Text style={styles.stepSub}>Who is this quote for?</Text>

        <Card>
          <Input label="Client Name *" value={client.name} onChangeText={(v) => setClient({ ...client, name: v })} placeholder="John Doe" />
          <Input label="Company Name" value={client.company} onChangeText={(v) => setClient({ ...client, company: v })} placeholder="Acme Corp" />
          <Input label="Phone" value={client.phone} onChangeText={(v) => setClient({ ...client, phone: v })} placeholder="+91 98765 43210" keyboardType="phone-pad" />
          <Input label="Email" value={client.email} onChangeText={(v) => setClient({ ...client, email: v })} placeholder="john@company.com" keyboardType="email-address" />
          <Input label="Location / City" value={client.location} onChangeText={(v) => setClient({ ...client, location: v })} placeholder="Mumbai, Maharashtra" />
        </Card>

        <Card>
          <Text style={styles.fieldLabel}>Project Type</Text>
          <View style={styles.chipsWrap}>
            {PROJECT_TYPES.map((pt) => (
              <TouchableOpacity
                key={pt}
                style={[styles.chip, client.projectType === pt && styles.chipActive]}
                onPress={() => setClient({ ...client, projectType: pt })}
              >
                <Text style={[styles.chipText, client.projectType === pt && styles.chipTextActive]}>{pt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Salesperson Name" value={client.salesperson} onChangeText={(v) => setClient({ ...client, salesperson: v })} placeholder="Your name" />
        </Card>

        <Card glass>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>QUOTE NUMBER</Text>
              <Text style={styles.metaValue}>{quoteNumber}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>DATE</Text>
              <Text style={styles.metaValue}>{today}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    );
  }

  function renderStep2() {
    const catServices = SERVICES[SERVICE_CATEGORIES[activeCat]] || [];
    return (
      <View style={{ flex: 1 }}>
        {/* Quick Packages */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packagesScroll}>
          {QUICK_PACKAGES.map((pkg) => (
            <TouchableOpacity key={pkg.id} onPress={() => applyPackage(pkg)} style={styles.pkgCard}>
              <LinearGradient colors={pkg.color} style={styles.pkgGrad}>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                <Text style={styles.pkgPrice}>{formatCurrency(pkg.totalPrice)}</Text>
                <Text style={styles.pkgTag}>One-tap apply</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabs}>
          {SERVICE_CATEGORIES.map((cat, i) => (
            <TouchableOpacity key={cat} style={[styles.catTab, activeCat === i && styles.catTabActive]} onPress={() => setActiveCat(i)}>
              <Text style={[styles.catTabText, activeCat === i && styles.catTabTextActive]}>
                {['📣', '💻', '📱', '🤖'][i]} {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Services */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {catServices.map((service) => {
            const sel = isSelected(service.id);
            const selData = selectedServices.find((s) => s.id === service.id);
            return (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, sel && styles.serviceCardActive]}
                onPress={() => toggleService(service)}
              >
                <View style={styles.serviceHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.serviceNameRow}>
                      {service.recommended && <Text style={styles.recBadge}>★ RECOMMENDED</Text>}
                      <Text style={styles.serviceName}>{service.name}</Text>
                    </View>
                    <Text style={styles.serviceDesc}>{service.description}</Text>
                    {service.sacCode && <Text style={styles.sacCode}>SAC: {service.sacCode}</Text>}
                  </View>
                  <View style={[styles.checkBox, sel && styles.checkBoxActive]}>
                    {sel && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </View>

                {sel && selData && (
                  <View style={styles.serviceOptions}>
                    {/* Duration selector for monthly services */}
                    {service.priceType === 'monthly' && (
                      <View>
                        <Text style={styles.optionLabel}>Duration</Text>
                        <View style={styles.durRow}>
                          {DURATIONS.map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[styles.durBtn, selData.selectedDuration === d && styles.durBtnActive]}
                              onPress={() => updateService(service.id, { selectedDuration: d })}
                            >
                              <Text style={[styles.durBtnText, selData.selectedDuration === d && styles.durBtnTextActive]}>
                                {d}mo
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                    {/* Tier selector for app development */}
                    {service.tiers && (
                      <View>
                        <Text style={styles.optionLabel}>Package Tier</Text>
                        <View style={styles.durRow}>
                          {Object.keys(service.tiers).map((tier) => (
                            <TouchableOpacity
                              key={tier}
                              style={[styles.durBtn, selData.selectedTier === tier && styles.durBtnActive, { paddingHorizontal: 12 }]}
                              onPress={() => updateService(service.id, { selectedTier: tier })}
                            >
                              <Text style={[styles.durBtnText, selData.selectedTier === tier && styles.durBtnTextActive]}>{tier}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {selData.selectedTier && (
                          <Text style={styles.tierFeature}>{service.tiers[selData.selectedTier]?.features}</Text>
                        )}
                      </View>
                    )}
                    {/* Price display */}
                    <View style={styles.servicePriceRow}>
                      <Text style={styles.servicePrice}>{formatCurrency(selData.totalPrice)}</Text>
                      {service.priceType === 'monthly' && (
                        <Text style={styles.servicePriceSub}>for {selData.selectedDuration} month(s)</Text>
                      )}
                      {service.priceType === 'hybrid' && (
                        <Text style={styles.servicePriceSub}>
                          {formatCurrency(service.setupCost)} setup + {formatCurrency(service.monthlyCost)}/mo
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {!sel && (
                  <View style={styles.servicePriceRow}>
                    <Text style={styles.serviceBasePrice}>
                      {service.tiers
                        ? `From ${formatCurrency(Object.values(service.tiers)[0].price)}`
                        : service.priceType === 'hybrid'
                          ? `${formatCurrency(service.setupCost)} + ${formatCurrency(service.monthlyCost)}/mo`
                          : formatCurrency(service.basePrice)
                      }
                    </Text>
                    {service.priceType === 'monthly' && <Text style={styles.servicePriceSub}>/month</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>

        {selectedServices.length > 0 && (
          <View style={styles.selSummary}>
            <Text style={styles.selSummaryText}>{selectedServices.length} service(s) · {formatCurrency(subtotal)}</Text>
          </View>
        )}
      </View>
    );
  }

  function renderStep3() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {suggestion && (
          <LinearGradient colors={suggestion.color} style={styles.suggestionBanner}>
            <Text style={styles.suggestionIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.suggestionName}>{suggestion.name}</Text>
              <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
            </View>
          </LinearGradient>
        )}

        <Text style={styles.stepTitle}>Pricing Summary</Text>

        {/* Service breakdown */}
        <Card>
          {selectedServices.map((s) => (
            <View key={s.id} style={styles.priceRow}>
              <Text style={styles.priceRowName} numberOfLines={1}>{s.name}</Text>
              <Text style={styles.priceRowVal}>{formatCurrency(s.totalPrice || 0)}</Text>
            </View>
          ))}
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Subtotal</Text>
            <Text style={styles.priceRowVal}>{formatCurrency(pricing.subtotal)}</Text>
          </View>
        </Card>

        {/* Discount */}
        <Card>
          <Text style={styles.fieldLabel}>Discount</Text>
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
          <Input
            label={discountType === 'percent' ? 'Discount %' : 'Discount Amount (₹)'}
            value={discountValue}
            onChangeText={setDiscountValue}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </Card>

        {/* GST */}
        <Card>
          <Text style={styles.fieldLabel}>GST / Tax</Text>
          <View style={styles.gstRow}>
            {[['none', 'No GST'], ['cgst_sgst', 'CGST + SGST (18%)'], ['igst', 'IGST (18%)']].map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.gstBtn, gstType === val && styles.gstBtnActive]}
                onPress={() => setGstType(val)}
              >
                <Text style={[styles.gstBtnText, gstType === val && styles.gstBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Upsells */}
        {upsells.length > 0 && (
          <Card>
            <Text style={styles.fieldLabel}>Recommended Add-ons</Text>
            <View style={styles.upsellRow}>
              {upsells.map((u) => (
                <TouchableOpacity key={u.id} style={styles.upsellChip}
                  onPress={() => { setStep(1); }}>
                  <Text style={styles.upsellLabel}>{u.label}</Text>
                  <Text style={styles.upsellSub}>{u.subtext}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Grand Total */}
        <LinearGradient colors={[colors.accentPurple, colors.accentBlue]} style={styles.totalCard}>
          {pricing.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>Discount</Text>
              <Text style={[styles.totalRowVal, { color: '#86efac' }]}>- {formatCurrency(pricing.discountAmount)}</Text>
            </View>
          )}
          {pricing.cgst > 0 && (
            <>
              <View style={styles.totalRow}><Text style={styles.totalRowLabel}>CGST (9%)</Text><Text style={styles.totalRowVal}>{formatCurrency(pricing.cgst)}</Text></View>
              <View style={styles.totalRow}><Text style={styles.totalRowLabel}>SGST (9%)</Text><Text style={styles.totalRowVal}>{formatCurrency(pricing.sgst)}</Text></View>
            </>
          )}
          {pricing.igst > 0 && (
            <View style={styles.totalRow}><Text style={styles.totalRowLabel}>IGST (18%)</Text><Text style={styles.totalRowVal}>{formatCurrency(pricing.igst)}</Text></View>
          )}
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
        <Text style={styles.stepTitle}>Ready to Send!</Text>
        <Text style={styles.stepSub}>Review and export your proposal</Text>

        <Card glass>
          <Text style={styles.reviewLabel}>CLIENT</Text>
          <Text style={styles.reviewValue}>{client.name}</Text>
          {client.company ? <Text style={styles.reviewSub}>{client.company}</Text> : null}

          <View style={styles.reviewDivider} />
          <Text style={styles.reviewLabel}>SERVICES ({selectedServices.length})</Text>
          {selectedServices.map((s) => (
            <View key={s.id} style={styles.reviewServiceRow}>
              <Text style={styles.reviewServiceName} numberOfLines={1}>{s.name}</Text>
              <Text style={styles.reviewServicePrice}>{formatCurrency(s.totalPrice || 0)}</Text>
            </View>
          ))}

          <View style={styles.reviewDivider} />
          <Text style={styles.reviewLabel}>GRAND TOTAL</Text>
          <Text style={styles.reviewTotal}>{formatCurrency(pricing.grandTotal)}</Text>
        </Card>

        <GradientButton label="Preview Proposal" icon="👁" onPress={previewQuote} style={styles.actionBtn2} />
        <GradientButton label="Save Quote" icon="💾" loading={saving} onPress={handleSave} style={styles.actionBtn2} />
        <Text style={styles.saveTip}>Saving creates a record in your dashboard</Text>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Top bar */}
        <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>New Quote</Text>
          <Text style={styles.topBarQuote}>{quoteNumber}</Text>
        </LinearGradient>

        <StepIndicator steps={STEPS} currentStep={step} />

        <View style={styles.content}>
          {step === 0 && renderStep1()}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
          {step === 3 && renderStep4()}
        </View>

        {/* Bottom nav */}
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
          {step > 0 && (
            <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
              <Text style={styles.prevBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 && (
            <GradientButton label={step === 2 ? 'Review' : 'Continue →'} onPress={nextStep} style={{ flex: 1 }} />
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
  backBtn: { padding: 4 },
  backText: { color: colors.accentPurple, fontSize: typography.sm, fontWeight: '600' },
  topBarTitle: { fontSize: typography.lg, fontWeight: '800', color: colors.textPrimary },
  topBarQuote: { fontSize: typography.xs, color: colors.textMuted },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  stepTitle: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: 4, marginTop: spacing.md },
  stepSub: { fontSize: typography.sm, color: colors.textMuted, marginBottom: spacing.xl },
  fieldLabel: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600', marginBottom: spacing.md, letterSpacing: 0.3 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSecondary,
  },
  chipActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  chipText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: colors.accentPurple, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 10, color: colors.textDisabled, letterSpacing: 1.5, textTransform: 'uppercase' },
  metaValue: { fontSize: typography.md, color: colors.accentPurple, fontWeight: '700', marginTop: 2 },
  packagesScroll: { maxHeight: 110, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  pkgCard: { marginRight: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  pkgGrad: { padding: spacing.lg, width: 180 },
  pkgName: { fontSize: typography.sm, fontWeight: '700', color: colors.white },
  pkgPrice: { fontSize: typography.xl, fontWeight: '800', color: colors.white, marginTop: 2 },
  pkgTag: { fontSize: typography.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  catTabs: { maxHeight: 48, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  catTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
    backgroundColor: colors.bgCard,
  },
  catTabActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  catTabText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  catTabTextActive: { color: colors.accentPurple },
  serviceCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: spacing.xl,
  },
  serviceCardActive: { borderColor: colors.accentPurple, backgroundColor: colors.accentPurple + '11' },
  serviceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  serviceNameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 2 },
  recBadge: { fontSize: 9, color: colors.warning, fontWeight: '800', letterSpacing: 0.8 },
  serviceName: { fontSize: typography.md, fontWeight: '700', color: colors.textPrimary },
  serviceDesc: { fontSize: typography.xs, color: colors.textMuted, lineHeight: 17, marginTop: 2 },
  sacCode: { fontSize: 10, color: colors.textDisabled, marginTop: 2 },
  checkBox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive: { backgroundColor: colors.accentPurple, borderColor: colors.accentPurple },
  checkMark: { color: colors.white, fontSize: 13, fontWeight: '800' },
  serviceOptions: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  optionLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '600', marginBottom: 6 },
  durRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md, flexWrap: 'wrap' },
  durBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSecondary,
  },
  durBtnActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  durBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  durBtnTextActive: { color: colors.accentPurple, fontWeight: '700' },
  tierFeature: { fontSize: typography.xs, color: colors.textMuted, fontStyle: 'italic', marginTop: -8, marginBottom: spacing.sm },
  servicePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  servicePrice: { fontSize: typography.lg, fontWeight: '800', color: colors.accentPurple },
  serviceBasePrice: { fontSize: typography.md, fontWeight: '600', color: colors.textMuted },
  servicePriceSub: { fontSize: typography.xs, color: colors.textDisabled },
  selSummary: {
    backgroundColor: colors.accentPurple + '22', paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.accentPurple + '44',
  },
  selSummaryText: { fontSize: typography.sm, color: colors.accentPurple, fontWeight: '700', textAlign: 'center' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceRowName: { fontSize: typography.sm, color: colors.textSecondary, flex: 1, marginRight: 8 },
  priceRowLabel: { fontSize: typography.md, fontWeight: '700', color: colors.textPrimary },
  priceRowVal: { fontSize: typography.sm, fontWeight: '700', color: colors.textPrimary },
  priceDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  toggleBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  toggleBtnTextActive: { color: colors.accentPurple, fontWeight: '700' },
  gstRow: { gap: spacing.sm },
  gstBtn: {
    paddingVertical: 10, paddingHorizontal: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  gstBtnActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  gstBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: '600' },
  gstBtnTextActive: { color: colors.accentPurple, fontWeight: '700' },
  upsellRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  upsellChip: {
    backgroundColor: colors.accentBlue + '22', borderWidth: 1, borderColor: colors.accentBlue + '44',
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  upsellLabel: { fontSize: typography.sm, color: colors.accentBlue, fontWeight: '700' },
  upsellSub: { fontSize: typography.xs, color: colors.textMuted },
  suggestionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl,
    padding: spacing.xl, marginBottom: spacing.lg,
  },
  suggestionIcon: { fontSize: 28 },
  suggestionName: { fontSize: typography.lg, fontWeight: '800', color: colors.white },
  suggestionDesc: { fontSize: typography.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
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
  saveTip: { fontSize: typography.xs, color: colors.textDisabled, textAlign: 'center', marginBottom: spacing.md },
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
