import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { getTrades } from '../database/database';
import { Trade, AssetType, ASSET_TYPES } from '../types';
import TradeCard from '../components/TradeCard';
import { TradesStackParamList } from '../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<TradesStackParamList, 'TradesList'>;

export default function TradesScreen() {
  const navigation = useNavigation<NavProp>();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<AssetType | 'All'>('All');

  useFocusEffect(
    useCallback(() => {
      loadTrades();
    }, [search, activeFilter])
  );

  const loadTrades = () => {
    const filters: { assetType?: AssetType; searchSymbol?: string } = {};
    if (activeFilter !== 'All') filters.assetType = activeFilter;
    if (search.trim()) filters.searchSymbol = search.trim();
    setTrades(getTrades(filters));
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filters: { assetType?: AssetType; searchSymbol?: string } = {};
    if (activeFilter !== 'All') filters.assetType = activeFilter;
    if (text.trim()) filters.searchSymbol = text.trim();
    setTrades(getTrades(filters));
  };

  const handleFilter = (filter: AssetType | 'All') => {
    setActiveFilter(filter);
    const filters: { assetType?: AssetType; searchSymbol?: string } = {};
    if (filter !== 'All') filters.assetType = filter;
    if (search.trim()) filters.searchSymbol = search.trim();
    setTrades(getTrades(filters));
  };

  const filterLabels: (AssetType | 'All')[] = ['All', ...ASSET_TYPES];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by symbol..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {filterLabels.map((label) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.filterChip,
              activeFilter === label && styles.filterChipActive,
            ]}
            onPress={() => handleFilter(label)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === label && styles.filterChipTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {trades.length} {trades.length === 1 ? 'trade' : 'trades'}
        </Text>
      </View>

      {/* Trade List */}
      <FlatList
        data={trades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TradeCard
            trade={item}
            onPress={() => navigation.navigate('TradeDetail', { tradeId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No trades found</Text>
            <Text style={styles.emptySub}>
              {search || activeFilter !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Add your first trade using the + tab'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  countRow: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
