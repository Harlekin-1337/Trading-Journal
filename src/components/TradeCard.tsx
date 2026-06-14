import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { Trade, ASSET_ICONS } from '../types';

interface TradeCardProps {
  trade: Trade;
  onPress: () => void;
}

export default function TradeCard({ trade, onPress }: TradeCardProps) {
  const isProfitable = (trade.pnl ?? 0) >= 0;
  const isOpen = trade.status === 'Open';
  const pnlColor = isOpen ? colors.textSecondary : isProfitable ? colors.profit : colors.loss;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const formatPnl = (value: number | undefined) => {
    if (value === undefined) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  const formatPnlPercent = (value: number | undefined) => {
    if (value === undefined) return '';
    const sign = value >= 0 ? '+' : '';
    return ` (${sign}${value.toFixed(2)}%)`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.assetIcon}>{ASSET_ICONS[trade.assetType]}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.symbol}>{trade.symbol}</Text>
            <View style={[
              styles.directionBadge,
              trade.direction === 'Long' ? styles.longBadge : styles.shortBadge
            ]}>
              <Text style={[
                styles.directionText,
                trade.direction === 'Long' ? styles.longText : styles.shortText
              ]}>
                {trade.direction === 'Long' ? '▲ LONG' : '▼ SHORT'}
              </Text>
            </View>
          </View>
          <Text style={styles.date}>
            {formatDate(trade.entryDate)}
            {trade.exitDate ? ` → ${formatDate(trade.exitDate)}` : ''}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.assetType}>{trade.assetType}</Text>
            {isOpen && (
              <View style={styles.openBadge}>
                <Text style={styles.openText}>OPEN</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.pnl, { color: pnlColor }]}>
          {isOpen ? 'Open' : formatPnl(trade.pnl)}
        </Text>
        {!isOpen && trade.pnlPercent !== undefined && (
          <Text style={[styles.pnlPercent, { color: pnlColor }]}>
            {formatPnlPercent(trade.pnlPercent).trim()}
          </Text>
        )}
        <Text style={styles.quantity}>
          {trade.quantity} @ ${trade.entryPrice.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assetIcon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  directionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  longBadge: {
    backgroundColor: colors.profitBackground,
  },
  shortBadge: {
    backgroundColor: colors.lossBackground,
  },
  directionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  longText: {
    color: colors.profit,
  },
  shortText: {
    color: colors.loss,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetType: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  openBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: colors.accentBackground,
  },
  openText: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: '700',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  pnl: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  pnlPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  quantity: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
