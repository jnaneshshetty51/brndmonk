import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { formatDate, truncate } from '../utils/formatters';
import { saveClient, deleteClient } from '../firebase/clients';
import Input from '../components/common/Input';
import GradientButton from '../components/common/GradientButton';

export default function ClientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
    gstNumber: '', pan: '', notes: '',
  });

  async function onRefresh() {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }

  const filtered = state.clients.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.name.trim()) { Alert.alert('Required', 'Client name is required'); return; }
    setSaving(true);
    try {
      const id = await saveClient({ ...form });
      dispatch({ type: 'ADD_CLIENT', payload: { id, ...form } });
      setShowModal(false);
      setForm({ name: '', company: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', gstNumber: '', pan: '', notes: '' });
    } catch (e) {
      Alert.alert('Error', 'Could not save client.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert('Delete Client', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteClient(id);
          dispatch({ type: 'DELETE_CLIENT', payload: id });
        },
      },
    ]);
  }

  function getClientStats(client) {
    const quotes = state.quotes.filter((q) => q.client?.email === client.email);
    const invoices = state.invoices.filter((inv) => inv.client?.email === client.email);
    const revenue = invoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + (inv.pricing?.grandTotal || 0), 0);
    return { quotes: quotes.length, invoices: invoices.length, revenue };
  }

  function renderClient({ item: c }) {
    const stats = getClientStats(c);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <LinearGradient colors={[colors.accentPurple, colors.accentBlue]} style={styles.avatar}>
            <Text style={styles.avatarText}>{(c.name || '?')[0].toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.clientName}>{c.name}</Text>
            {c.company ? <Text style={styles.company}>{c.company}</Text> : null}
            <Text style={styles.email}>{c.email}</Text>
            {c.phone ? <Text style={styles.meta}>📞 {c.phone}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => handleDelete(c.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {c.gstNumber && <Text style={styles.gstTag}>GST: {c.gstNumber}</Text>}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{stats.quotes}</Text>
            <Text style={styles.statLabel}>Quotes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{stats.invoices}</Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.success }]}>₹{(stats.revenue / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => navigation.navigate('Quotes', { screen: 'CreateQuote' })}
          >
            <Text style={styles.actionChipText}>+ Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, { borderColor: colors.success + '44', backgroundColor: colors.success + '11' }]}
            onPress={() => navigation.navigate('Invoices', { screen: 'CreateInvoice' })}
          >
            <Text style={[styles.actionChipText, { color: colors.success }]}>+ Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Clients</Text>
          <Text style={styles.headerSub}>{state.clients.length} clients</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <LinearGradient colors={[colors.accentPurple, colors.accentBlue]} style={styles.addBtnGrad}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search clients..."
          placeholderTextColor={colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || item.email}
        renderItem={renderClient}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPurple} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptySub}>Tap "+ Add" to add your first client</Text>
          </View>
        }
      />

      {/* Add Client Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Client</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={styles.modalSave}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Input label="Full Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Input label="Company" value={form.company} onChangeText={(v) => setForm({ ...form, company: v })} />
            <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
            <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <Input label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} multiline numberOfLines={2} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Input label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} /></View>
              <View style={{ flex: 1 }}><Input label="State" value={form.state} onChangeText={(v) => setForm({ ...form, state: v })} /></View>
            </View>
            <Input label="Pincode" value={form.pincode} onChangeText={(v) => setForm({ ...form, pincode: v })} keyboardType="number-pad" />
            <Input label="GST Number" value={form.gstNumber} onChangeText={(v) => setForm({ ...form, gstNumber: v })} />
            <Input label="PAN" value={form.pan} onChangeText={(v) => setForm({ ...form, pan: v })} />
            <Input label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline numberOfLines={3} />
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingBottom: 16, paddingHorizontal: spacing.xl,
  },
  headerTitle: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  addBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 20, paddingVertical: 10 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.sm },
  searchWrap: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  search: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: 12,
    color: colors.textPrimary, fontSize: typography.sm,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 104 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: typography.lg, fontWeight: '800' },
  clientName: { fontSize: typography.md, fontWeight: '800', color: colors.textPrimary },
  company: { fontSize: typography.sm, color: colors.textMuted },
  email: { fontSize: typography.xs, color: colors.textDisabled },
  meta: { fontSize: typography.xs, color: colors.textDisabled, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: colors.error, fontSize: typography.sm },
  gstTag: {
    fontSize: 10, color: colors.accentBlue, backgroundColor: colors.infoBg,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
    alignSelf: 'flex-start', marginBottom: spacing.md,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.md },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: typography.lg, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionChip: {
    paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.accentPurple + '44', backgroundColor: colors.accentPurple + '11',
  },
  actionChipText: { fontSize: typography.xs, color: colors.accentPurple, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: typography.sm, color: colors.textMuted },
  modal: { flex: 1, backgroundColor: colors.bgPrimary },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: spacing.xl,
  },
  modalTitle: { fontSize: typography.lg, fontWeight: '800', color: colors.textPrimary },
  modalCancel: { fontSize: typography.md, color: colors.textMuted },
  modalSave: { fontSize: typography.md, color: colors.accentPurple, fontWeight: '700' },
  modalBody: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
});
