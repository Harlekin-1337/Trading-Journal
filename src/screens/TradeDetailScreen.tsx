import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { Trade, ASSET_ICONS } from '../types';
import { getTradeById, deleteTrade } from '../database/database';
import { TradesStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<TradesStackParamList, 'TradeDetail'>;
type NavProp = NativeStackNavigationProp<TradesStackParamList, 'TradeDetail'>;

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

export default function TradeDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { tradeId } = route.params;
  const [trade, setTrade] = useState<Trade | null>(null);

  useFocusEffect(
    useCallback(() => {
      const t = getTradeById(tradeId);
      setTrade(t);
    }, [tradeId])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Trade',
      `Are you sure you want to delete ${trade?.symbol}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTrade(tradeId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!trade) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Trade not found</Text>
      </View>
    );
  }

  const isProfitable = (trade.pnl ?? 0) >= 0;
  const isOpen = trade.status === 'Open';
  const pnlColor = isOpen ? colors.textSecondary : isProfitable ? colors.profit : colors.loss;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPnl = (value: number | undefined) => {
    if (value === undefined) return '—';
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.assetIcon}>
            <Text style={styles.assetEmoji}>{ASSET_ICONS[trade.assetType]}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.symbolText}>{trade.symbol}</Text>
            <View style={styles.badgesRow}>
              <View style={[
                styles.badge,
                trade.direction === 'Long' ? styles.longBadge : styles.shortBadge,
              ]}>
                <Text style={[
                  styles.badgeText,
                  trade.direction === 'Long' ? styles.longText : styles.shortText,
                ]}>
                  {trade.direction === 'Long' ? '▲ LONG' : '▼ SHORT'}
                </Text>
              </View>
              <View style={styles.assetTypeBadge}>
                <Text style={styles.assetTypeText}>{trade.assetType}</Text>
              </View>
              {isOpen && (
                <View style={styles.openBadge}>
                  <Text style={styles.openText}>OPEN</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {!isOpen && (
          <View style={styles.pnlSection}>
            <Text style={[styles.pnlValue, { color: pnlColor }]}>
              {formatPnl(trade.pnl)}
            </Text>
            {trade.pnlPercent !== undefined && (
              <Text style={[styles.pnlPercent, { color: pnlColor }]}>
                ({trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Trade Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trade Details</Text>
        <View style={styles.card}>
          <DetailRow label="Entry Price" value={`$${trade.entryPrice.toFixed(4)}`} />
          {trade.exitPrice !== undefined && (
            <DetailRow label="Exit Price" value={`$${trade.exitPrice.toFixed(4)}`} />
          )}
          <DetailRow label="Quantity" value={String(trade.quantity)} />
          <DetailRow label="Fees" value={`$${trade.fees.toFixed(2)}`} />
          <DetailRow
            label="Position Value"
            value={`$${(trade.entryPrice * trade.quantity).toFixed(2)}`}
          />
          {!isOpen && trade.pnl !== undefined && (
            <DetailRow
              label="Net P&L"
              value={formatPnl(trade.pnl)}
              valueColor={pnlColor}
            />
          )}
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>
        <View style={styles.card}>
          <DetailRow label="Entry Date" value={formatDate(trade.entryDate)} />
          {trade.exitDate && (
            <DetailRow label="Exit Date" value={formatDate(trade.exitDate)} />
          )}
          <DetailRow label="Logged On" value={formatDate(trade.createdAt)} />
        </View>
      </View>

      {/* Tags */}
      {trade.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {trade.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Notes */}
      {trade.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{trade.notes}</Text>
          </View>
        </View>
      ) : null}

      {/* Screenshot */}
      {trade.screenshotUri && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chart Screenshot</Text>
          <Image source={{ uri: trade.screenshotUri }} style={styles.screenshot} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditTrade', { tradeId: trade.id })}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={18} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={colors.loss} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFound: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  assetEmoji: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  symbolText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  longBadge: {
    backgroundColor: colors.profitBackground,
  },
  shortBadge: {
    backgroundColor: colors.lossBackground,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  longText: {
    color: colors.profit,
  },
  shortText: {
    color: colors.loss,
  },
  assetTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.purpleBackground,
  },
  assetTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.purple,
  },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.accentBackground,
  },
  openText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  pnlSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pnlValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  pnlPercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    padding: 14,
  },
  screenshot: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.lossBackground,
    borderWidth: 1.5,
    borderColor: colors.loss,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.loss,
  },
});
