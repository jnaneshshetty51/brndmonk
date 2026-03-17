import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { formatCurrency, formatDate, truncate } from '../utils/formatters';
import { QUOTE_STATUSES, INVOICE_STATUSES } from '../constants/defaults';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';

function StatCard({ label, value, sub, gradient, icon }) {
  return (
    <LinearGradient colors={gradient} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </LinearGradient>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { stats, state, refreshData } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }

  const recentQuotes = state.quotes.slice(0, 3);
  const recentInvoices = state.invoices.slice(0, 3);

  const salespersonMap = {};
  state.quotes.forEach((q) => {
    const sp = q.client?.salesperson || 'Team';
    if (!salespersonMap[sp]) salespersonMap[sp] = { won: 0, total: 0 };
    salespersonMap[sp].total++;
    if (q.status === 'won') salespersonMap[sp].won++;
  });
  const leaderboard = Object.entries(salespersonMap)
    .sort((a, b) => b[1].won - a[1].won)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#16161f', '#0a0a0f']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerSub}>Welcome back 👋</Text>
          <Text style={styles.headerTitle}>Brnd Monk</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>ASTRAVEDA</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPurple} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Revenue"
            value={formatCurrency(stats.paidRevenue)}
            sub="Paid invoices"
            gradient={['#7c3aed', '#3b82f6']}
            icon="💰"
          />
          <StatCard
            label="Pending"
            value={formatCurrency(stats.pendingRevenue)}
            sub="To collect"
            gradient={['#f59e0b', '#ef4444']}
            icon="⏳"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Quotes"
            value={`${stats.wonQuotes}/${stats.totalQuotes}`}
            sub="Won / Total"
            gradient={['#059669', '#10b981']}
            icon="📋"
          />
          <StatCard
            label="Overdue"
            value={stats.overdueInvoices}
            sub="Invoices"
            gradient={['#991b1b', '#ef4444']}
            icon="⚠️"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Quotes', { screen: 'CreateQuote' })}
            >
              <LinearGradient colors={[colors.accentPurple, colors.accentBlue]} style={styles.actionGrad}>
                <Text style={styles.actionIcon}>📄</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>New Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Invoices', { screen: 'CreateInvoice' })}
            >
              <LinearGradient colors={['#059669', '#10b981']} style={styles.actionGrad}>
                <Text style={styles.actionIcon}>🧾</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>New Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Clients')}
            >
              <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.actionGrad}>
                <Text style={styles.actionIcon}>👥</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Clients</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <LinearGradient colors={['#475569', '#64748b']} style={styles.actionGrad}>
                <Text style={styles.actionIcon}>⚙️</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Quotes */}
        {recentQuotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Quotes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Quotes')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {recentQuotes.map((q) => {
              const st = QUOTE_STATUSES[q.status] || QUOTE_STATUSES.draft;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={styles.listItem}
                  onPress={() => navigation.navigate('Quotes', { screen: 'QuotePreview', params: { quote: q } })}
                >
                  <View style={styles.listLeft}>
                    <Text style={styles.listTitle}>{truncate(q.client?.name || 'Client', 22)}</Text>
                    <Text style={styles.listSub}>{q.quoteNumber} · {formatDate(q.date)}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={styles.listAmount}>{formatCurrency(q.pricing?.grandTotal || 0)}</Text>
                    <Badge label={st.label} color={st.color} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recent Invoices */}
        {recentInvoices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Invoices</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Invoices')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {recentInvoices.map((inv) => {
              const st = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.draft;
              return (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.listItem}
                  onPress={() => navigation.navigate('Invoices', { screen: 'InvoicePreview', params: { invoice: inv } })}
                >
                  <View style={styles.listLeft}>
                    <Text style={styles.listTitle}>{truncate(inv.client?.name || 'Client', 22)}</Text>
                    <Text style={styles.listSub}>{inv.header?.invoiceNumber} · {formatDate(inv.header?.date)}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={styles.listAmount}>{formatCurrency(inv.pricing?.grandTotal || 0)}</Text>
                    <Badge label={st.label} color={st.color} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salesperson Leaderboard</Text>
            {leaderboard.map(([name, data], i) => (
              <View key={name} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderName}>{name}</Text>
                  <Text style={styles.leaderSub}>{data.won} won / {data.total} total</Text>
                </View>
                <Text style={styles.leaderRate}>
                  {data.total > 0 ? `${Math.round((data.won / data.total) * 100)}%` : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {state.quotes.length === 0 && state.invoices.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🚀</Text>
            <Text style={styles.emptyTitle}>Ready to close deals?</Text>
            <Text style={styles.emptyText}>Create your first quote or invoice to get started.</Text>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 20, paddingHorizontal: spacing.xl,
  },
  headerSub: { fontSize: typography.sm, color: colors.textMuted, marginBottom: 2 },
  headerTitle: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerBadge: {
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  headerBadgeText: { fontSize: typography.xs, color: colors.accentPurple, fontWeight: '700', letterSpacing: 1 },
  scroll: { flex: 1, paddingHorizontal: spacing.xl },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statCard: {
    flex: 1, borderRadius: radius.xl, padding: spacing.xl,
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statValue: { fontSize: typography.xxl, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  statLabel: { fontSize: typography.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  statSub: { fontSize: typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  section: { marginTop: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  seeAll: { fontSize: typography.sm, color: colors.accentPurple, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', width: 72 },
  actionGrad: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  listItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  listLeft: { flex: 1 },
  listRight: { alignItems: 'flex-end', gap: 4 },
  listTitle: { fontSize: typography.md, fontWeight: '700', color: colors.textPrimary },
  listSub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  listAmount: { fontSize: typography.md, fontWeight: '700', color: colors.accentPurple },
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  leaderRank: { fontSize: 22 },
  leaderName: { fontSize: typography.md, fontWeight: '700', color: colors.textPrimary },
  leaderSub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  leaderRate: { fontSize: typography.lg, fontWeight: '800', color: colors.accentPurple },
  emptyCard: { alignItems: 'center', marginTop: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.xl, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
