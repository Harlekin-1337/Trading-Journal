import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { getTrades, getStats } from '../database/database';
import { Trade, Stats } from '../types';
import TradeCard from '../components/TradeCard';
import StatCard from '../components/StatCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);

  useFocusEffect(
    useCallback(() => {
      const s = getStats();
      setStats(s);
      const trades = getTrades();
      setRecentTrades(trades.slice(0, 5));
    }, [])
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const pnlColor = stats ? (stats.totalPnl >= 0 ? colors.profit : colors.loss) : colors.text;

  const chartData = (() => {
    if (!stats || stats.cumulativePnlSeries.length < 2) return null;
    const series = stats.cumulativePnlSeries.slice(-30);
    return {
      labels: [],
      datasets: [{ data: series.map((p) => p.value) }],
    };
  })();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()} 👋</Text>
          <Text style={styles.subtitle}>Here's your trading overview</Text>
        </View>
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Total P&L Card */}
      <View style={styles.pnlCard}>
        <Text style={styles.pnlLabel}>Total P&L</Text>
        <Text style={[styles.pnlValue, { color: pnlColor }]}>
          {stats ? formatPnl(stats.totalPnl) : '$0.00'}
        </Text>
        <Text style={styles.pnlSub}>
          {stats?.totalTrades ?? 0} trades · {stats?.openTrades ?? 0} open
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          label="Win Rate"
          value={stats ? `${stats.winRate.toFixed(1)}%` : '0%'}
          valueColor={stats && stats.winRate >= 50 ? colors.profit : colors.loss}
          icon="🎯"
        />
        <View style={styles.statsGap} />
        <StatCard
          label="Wins"
          value={String(stats?.winningTrades ?? 0)}
          valueColor={colors.profit}
          icon="✅"
        />
        <View style={styles.statsGap} />
        <StatCard
          label="Losses"
          value={String(stats?.losingTrades ?? 0)}
          valueColor={colors.loss}
          icon="❌"
        />
      </View>

      {/* P&L Chart */}
      {chartData ? (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Cumulative P&L (Last 30)</Text>
          <LineChart
            data={chartData}
            width={CHART_WIDTH - 28}
            height={140}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) =>
                stats && stats.totalPnl >= 0
                  ? `rgba(16, 185, 129, ${opacity})`
                  : `rgba(239, 68, 68, ${opacity})`,
              labelColor: () => colors.textSecondary,
              strokeWidth: 2,
              propsForDots: {
                r: '0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '4',
                stroke: colors.border,
              },
            }}
            bezier
            withInnerLines={true}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={false}
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartIcon}>📈</Text>
          <Text style={styles.emptyChartText}>No trade data yet</Text>
          <Text style={styles.emptyChartSub}>
            Add your first trade to see your P&L chart
          </Text>
        </View>
      )}

      {/* Recent Trades */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Trades</Text>
        {recentTrades.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Trades')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentTrades.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateText}>No trades yet</Text>
          <Text style={styles.emptyStateSub}>
            Tap the + button to log your first trade
          </Text>
        </View>
      ) : (
        recentTrades.map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            onPress={() =>
              navigation.navigate('Trades', {
                screen: 'TradeDetail',
                params: { tradeId: trade.id },
              })
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateChip: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pnlCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pnlLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pnlValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  pnlSub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statsGap: {
    width: 8,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chart: {
    borderRadius: 8,
    marginTop: 8,
  },
  emptyChart: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyChartIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyChartSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
