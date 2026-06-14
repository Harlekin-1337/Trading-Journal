import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { getStats } from '../database/database';
import { Stats, ASSET_ICONS } from '../types';
import StatCard from '../components/StatCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 32;

const chartConfig = {
  backgroundColor: colors.card,
  backgroundGradientFrom: colors.card,
  backgroundGradientTo: colors.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: () => colors.textSecondary,
  strokeWidth: 2,
  propsForBackgroundLines: {
    strokeDasharray: '4',
    stroke: colors.border,
  },
  propsForLabels: {
    fontSize: 10,
  },
};

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyChartIcon}>📊</Text>
      <Text style={styles.emptyChartText}>{message}</Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(
    useCallback(() => {
      setStats(getStats());
    }, [])
  );

  if (!stats) return null;

  const fmt = (n: number, decimals = 2) =>
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const fmtPnl = (n: number) => {
    const sign = n >= 0 ? '+' : '';
    return `${sign}$${fmt(Math.abs(n))}`;
  };

  const pnlColor = stats.totalPnl >= 0 ? colors.profit : colors.loss;

  // Cumulative P&L chart
  const cumulativeChartData = (() => {
    if (stats.cumulativePnlSeries.length < 2) return null;
    const series = stats.cumulativePnlSeries.slice(-30);
    const lineColor = series[series.length - 1]?.value >= 0 ? colors.profit : colors.loss;
    return {
      labels: [],
      datasets: [
        {
          data: series.map((p) => p.value),
          color: (opacity = 1) =>
            lineColor === colors.profit
              ? `rgba(16, 185, 129, ${opacity})`
              : `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  })();

  // Monthly bar chart
  const monthlyChartData = (() => {
    if (stats.monthlyData.length === 0) return null;
    const recent = stats.monthlyData.slice(-6);
    return {
      labels: recent.map((m) => {
        const [year, month] = m.month.split('-');
        const d = new Date(Number(year), Number(month) - 1);
        return d.toLocaleDateString('en-US', { month: 'short' });
      }),
      datasets: [{ data: recent.map((m) => Math.abs(m.pnl)), colors: recent.map((m) => () => m.pnl >= 0 ? colors.profit : colors.loss) }],
    };
  })();

  // Pie chart
  const pieData =
    stats.winningTrades + stats.losingTrades > 0
      ? [
          {
            name: 'Wins',
            population: stats.winningTrades,
            color: colors.profit,
            legendFontColor: colors.text,
            legendFontSize: 13,
          },
          {
            name: 'Losses',
            population: stats.losingTrades,
            color: colors.loss,
            legendFontColor: colors.text,
            legendFontSize: 13,
          },
        ]
      : null;

  const profitFactorDisplay =
    stats.profitFactor === Infinity ? '∞' : fmt(stats.profitFactor);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Key Metrics */}
      <SectionHeader title="Key Metrics" />
      <View style={styles.statsGrid}>
        <StatCard
          label="Total P&L"
          value={fmtPnl(stats.totalPnl)}
          valueColor={pnlColor}
          flex={1}
        />
        <View style={styles.gridGap} />
        <StatCard
          label="Win Rate"
          value={`${fmt(stats.winRate, 1)}%`}
          valueColor={stats.winRate >= 50 ? colors.profit : colors.loss}
          flex={1}
        />
      </View>
      <View style={styles.statsGrid}>
        <StatCard label="Total Trades" value={String(stats.totalTrades)} icon="📋" flex={1} />
        <View style={styles.gridGap} />
        <StatCard label="Open Trades" value={String(stats.openTrades)} icon="🔓" valueColor={colors.accent} flex={1} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard label="Avg Win" value={`$${fmt(stats.avgWin)}`} valueColor={colors.profit} flex={1} />
        <View style={styles.gridGap} />
        <StatCard label="Avg Loss" value={`$${fmt(stats.avgLoss)}`} valueColor={colors.loss} flex={1} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard label="Profit Factor" value={profitFactorDisplay} valueColor={stats.profitFactor > 1 ? colors.profit : colors.loss} flex={1} />
        <View style={styles.gridGap} />
        <StatCard label="Max Drawdown" value={`$${fmt(stats.maxDrawdown)}`} valueColor={colors.loss} flex={1} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard label="Best Trade" value={`+$${fmt(stats.bestTrade)}`} valueColor={colors.profit} flex={1} />
        <View style={styles.gridGap} />
        <StatCard label="Worst Trade" value={`$${fmt(stats.worstTrade)}`} valueColor={colors.loss} flex={1} />
      </View>

      {/* Cumulative P&L Chart */}
      <SectionHeader title="Cumulative P&L" />
      <View style={styles.chartCard}>
        {cumulativeChartData ? (
          <LineChart
            data={cumulativeChartData}
            width={CHART_W - 24}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            }}
            bezier
            withInnerLines
            withOuterLines={false}
            withHorizontalLabels
            withVerticalLabels={false}
            withDots={false}
            style={styles.chart}
          />
        ) : (
          <EmptyChart message="Add at least 2 closed trades to see the chart" />
        )}
      </View>

      {/* Win/Loss Distribution */}
      <SectionHeader title="Win / Loss Distribution" />
      <View style={styles.chartCard}>
        {pieData ? (
          <PieChart
            data={pieData}
            width={CHART_W - 24}
            height={160}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="16"
            absolute={false}
            style={styles.chart}
          />
        ) : (
          <EmptyChart message="No closed trades yet" />
        )}
      </View>

      {/* Monthly P&L */}
      <SectionHeader title="Monthly P&L (last 6 months)" />
      <View style={styles.chartCard}>
        {monthlyChartData ? (
          <BarChart
            data={monthlyChartData}
            width={CHART_W - 24}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            }}
            yAxisLabel="$"
            yAxisSuffix=""
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        ) : (
          <EmptyChart message="No monthly data available" />
        )}
      </View>

      {/* Asset Type Breakdown */}
      {stats.assetStats.length > 0 && (
        <>
          <SectionHeader title="Performance by Asset" />
          <View style={styles.assetTable}>
            <View style={[styles.assetRow, styles.assetHeader]}>
              <Text style={[styles.assetCell, styles.assetCellHeader, { flex: 2 }]}>Asset</Text>
              <Text style={[styles.assetCell, styles.assetCellHeader]}>Trades</Text>
              <Text style={[styles.assetCell, styles.assetCellHeader]}>Win%</Text>
              <Text style={[styles.assetCell, styles.assetCellHeader]}>P&L</Text>
            </View>
            {stats.assetStats.map((as) => {
              const asPnlColor = as.totalPnl >= 0 ? colors.profit : colors.loss;
              return (
                <View key={as.assetType} style={styles.assetRow}>
                  <View style={[styles.assetCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Text style={{ fontSize: 16 }}>{ASSET_ICONS[as.assetType]}</Text>
                    <Text style={styles.assetCellText}>{as.assetType}</Text>
                  </View>
                  <Text style={[styles.assetCell, styles.assetCellText]}>{as.trades}</Text>
                  <Text style={[styles.assetCell, styles.assetCellText, { color: as.winRate >= 50 ? colors.profit : colors.loss }]}>
                    {fmt(as.winRate, 0)}%
                  </Text>
                  <Text style={[styles.assetCell, styles.assetCellText, { color: asPnlColor }]}>
                    {fmtPnl(as.totalPnl)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
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
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  gridGap: {
    width: 8,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chart: {
    borderRadius: 8,
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyChartIcon: {
    fontSize: 32,
  },
  emptyChartText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  assetTable: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assetHeader: {
    backgroundColor: colors.cardElevated,
  },
  assetCell: {
    flex: 1,
  },
  assetCellHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  assetCellText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
});
