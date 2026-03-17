import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { formatCurrency, formatDate, truncate, isOverdue } from '../../utils/formatters';
import { INVOICE_STATUSES } from '../../constants/defaults';
import Badge from '../../components/common/Badge';

export default function InvoiceListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }

  const filtered = state.invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.header?.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = state.invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.pricing?.grandTotal || 0), 0);

  function renderInvoice({ item: inv }) {
    const st = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.draft;
    const paidAmt = inv.paidAmount || 0;
    const total = inv.pricing?.grandTotal || 0;
    const overdue = inv.status !== 'paid' && isOverdue(inv.header?.dueDate);

    return (
      <TouchableOpacity
        style={[styles.card, overdue && styles.cardOverdue]}
        onPress={() => navigation.navigate('InvoicePreview', { invoice: inv })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{truncate(inv.client?.name || 'Client', 22)}</Text>
            {inv.client?.company ? <Text style={styles.company}>{inv.client.company}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.amount}>{formatCurrency(total)}</Text>
            <Badge label={overdue ? 'Overdue' : st.label} color={overdue ? colors.error : st.color} />
          </View>
        </View>

        {paidAmt > 0 && paidAmt < total && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(paidAmt / total) * 100}%` }]} />
          </View>
        )}

        <View style={styles.cardBottom}>
          <Text style={styles.meta}>{inv.header?.invoiceNumber}</Text>
          <Text style={styles.meta}>{formatDate(inv.header?.date)}</Text>
          {inv.header?.dueDate && <Text style={[styles.meta, overdue && { color: colors.error }]}>Due: {formatDate(inv.header.dueDate)}</Text>}
          {paidAmt > 0 && <Text style={[styles.meta, { color: colors.success }]}>Paid: {formatCurrency(paidAmt)}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Invoices</Text>
          <Text style={styles.headerSub}>{state.invoices.length} total · {formatCurrency(totalRevenue)} collected</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateInvoice')}
        >
          <LinearGradient colors={['#059669', '#10b981']} style={styles.addBtnGrad}>
            <Text style={styles.addBtnText}>+ New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by client or invoice number..."
          placeholderTextColor={colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {[['all', 'All'], ...Object.entries(INVOICE_STATUSES).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterBtn, filterStatus === key && styles.filterBtnActive]}
            onPress={() => setFilterStatus(key)}
          >
            <Text style={[styles.filterBtnText, filterStatus === key && styles.filterBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || item.header?.invoiceNumber}
        renderItem={renderInvoice}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.success} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No invoices yet</Text>
            <Text style={styles.emptySub}>Tap "+ New" to create your first invoice</Text>
          </View>
        }
      />
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
  filterScroll: { flexGrow: 0 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: 6, marginBottom: spacing.md },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.success + '22', borderColor: colors.success },
  filterBtnText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  filterBtnTextActive: { color: colors.success },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 104 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardOverdue: { borderColor: colors.error + '44', backgroundColor: colors.errorBg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  clientName: { fontSize: typography.lg, fontWeight: '800', color: colors.textPrimary },
  company: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: typography.lg, fontWeight: '800', color: colors.accentPurple },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 2 },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  meta: { fontSize: typography.xs, color: colors.textDisabled },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: typography.sm, color: colors.textMuted },
});
