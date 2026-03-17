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
import { formatCurrency, formatDate, truncate } from '../../utils/formatters';
import { QUOTE_STATUSES } from '../../constants/defaults';
import Badge from '../../components/common/Badge';

export default function QuoteListScreen() {
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

  const filtered = state.quotes.filter((q) => {
    const matchSearch =
      !search ||
      q.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.company?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function renderQuote({ item: q }) {
    const st = QUOTE_STATUSES[q.status] || QUOTE_STATUSES.draft;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('QuotePreview', { quote: q })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{truncate(q.client?.name || 'Client', 24)}</Text>
            {q.client?.company ? <Text style={styles.company}>{q.client.company}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.amount}>{formatCurrency(q.pricing?.grandTotal || 0)}</Text>
            <Badge label={st.label} color={st.color} />
          </View>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.meta}>{q.quoteNumber}</Text>
          <Text style={styles.meta}>{formatDate(q.date)}</Text>
          <Text style={styles.meta}>{q.selectedServices?.length || 0} services</Text>
          {q.client?.salesperson && <Text style={styles.meta}>by {q.client.salesperson}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Quotes</Text>
          <Text style={styles.headerSub}>{state.quotes.length} total · {state.quotes.filter((q) => q.status === 'won').length} won</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateQuote')}
        >
          <LinearGradient colors={[colors.accentPurple, colors.accentBlue]} style={styles.addBtnGrad}>
            <Text style={styles.addBtnText}>+ New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by client or quote number..."
          placeholderTextColor={colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {[['all', 'All'], ...Object.entries(QUOTE_STATUSES).map(([k, v]) => [k, v.label])].map(([key, label]) => (
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
        keyExtractor={(item) => item.id || item.quoteNumber}
        renderItem={renderQuote}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPurple} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No quotes yet</Text>
            <Text style={styles.emptySub}>Tap "+ New" to create your first quote</Text>
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
  filterRow: {
    flexDirection: 'row', paddingHorizontal: spacing.xl, gap: 8, marginBottom: spacing.md,
  },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.accentPurple + '22', borderColor: colors.accentPurple },
  filterBtnText: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '600' },
  filterBtnTextActive: { color: colors.accentPurple },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 104 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  clientName: { fontSize: typography.lg, fontWeight: '800', color: colors.textPrimary },
  company: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: typography.lg, fontWeight: '800', color: colors.accentPurple },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  meta: { fontSize: typography.xs, color: colors.textDisabled },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: typography.sm, color: colors.textMuted },
});
