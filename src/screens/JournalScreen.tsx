import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { JournalEntry, Mood, MOOD_OPTIONS } from '../types';
import { getJournalEntries } from '../database/database';
import { JournalStackParamList } from '../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<JournalStackParamList, 'JournalList'>;

function JournalCard({
  entry,
  onPress,
}: {
  entry: JournalEntry;
  onPress: () => void;
}) {
  const mood = MOOD_OPTIONS.find((m) => m.value === entry.mood);
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{mood?.emoji ?? '😐'}</Text>
          <Text style={styles.moodLabel}>{mood?.label ?? entry.mood}</Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(entry.date)}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {entry.title}
      </Text>
      {entry.content ? (
        <Text style={styles.cardPreview} numberOfLines={2}>
          {entry.content}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function JournalScreen() {
  const navigation = useNavigation<NavProp>();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moodFilter, setMoodFilter] = useState<Mood | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      setEntries(getJournalEntries(moodFilter === 'all' ? undefined : moodFilter));
    }, [moodFilter])
  );

  const handleFilterChange = (filter: Mood | 'all') => {
    setMoodFilter(filter);
    setEntries(getJournalEntries(filter === 'all' ? undefined : filter));
  };

  return (
    <View style={styles.container}>
      {/* Mood Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, moodFilter === 'all' && styles.filterChipActive]}
          onPress={() => handleFilterChange('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, moodFilter === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {MOOD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.filterChip, moodFilter === option.value && styles.filterChipActive]}
            onPress={() => handleFilterChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterEmoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.filterChipText,
                moodFilter === option.value && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddJournal', {})}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>New Entry</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JournalCard
            entry={item}
            onPress={() => navigation.navigate('AddJournal', { entryId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>No journal entries</Text>
            <Text style={styles.emptySub}>
              {moodFilter !== 'all'
                ? 'No entries with this mood filter'
                : 'Tap "New Entry" to start your trading diary'}
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
  filterScroll: {
    flexGrow: 0,
    marginTop: 12,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterEmoji: {
    fontSize: 14,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
