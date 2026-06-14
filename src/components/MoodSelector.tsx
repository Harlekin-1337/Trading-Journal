import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Mood, MOOD_OPTIONS } from '../types';

interface MoodSelectorProps {
  selected: Mood;
  onSelect: (mood: Mood) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      {MOOD_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.moodButton, isSelected && styles.moodButtonSelected]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  moodButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
