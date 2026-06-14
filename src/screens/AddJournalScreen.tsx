import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { colors } from '../theme/colors';
import { JournalEntry, Mood, MOOD_OPTIONS } from '../types';
import {
  insertJournalEntry,
  updateJournalEntry,
  getJournalEntryById,
  deleteJournalEntry,
} from '../database/database';
import MoodSelector from '../components/MoodSelector';
import { JournalStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<JournalStackParamList, 'AddJournal'>;

const TODAY = new Date().toISOString().split('T')[0];

export default function AddJournalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const editId = route.params?.entryId;
  const isEditing = !!editId;

  const [date, setDate] = useState(TODAY);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('neutral');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && editId) {
      const entry = getJournalEntryById(editId);
      if (entry) {
        setDate(entry.date);
        setTitle(entry.title);
        setContent(entry.content);
        setMood(entry.mood);
      }
    }
  }, [editId, isEditing]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required.');
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Validation Error', 'Date must be in YYYY-MM-DD format.');
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();

    const entry: JournalEntry = {
      id: isEditing && editId ? editId : uuidv4(),
      date,
      title: title.trim(),
      content: content.trim(),
      mood,
      linkedTradeIds: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (isEditing) {
        updateJournalEntry(entry);
      } else {
        insertJournalEntry(entry);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save journal entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteJournalEntry(editId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const moodOption = MOOD_OPTIONS.find((m) => m.value === mood);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Date <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Mood */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            How did trading go today?{' '}
            {moodOption && (
              <Text style={styles.moodLabel}>
                {moodOption.emoji} {moodOption.label}
              </Text>
            )}
          </Text>
          <MoodSelector selected={mood} onSelect={setMood} />
        </View>

        {/* Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Solid breakout day, controlled emotions"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="sentences"
          />
        </View>

        {/* Content */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Journal Entry</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={content}
            onChangeText={setContent}
            placeholder="What happened today? What did you learn? How were your emotions? Any mistakes to avoid next time?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
        </View>

        {/* Mood recap card */}
        {moodOption && (
          <View style={styles.moodRecap}>
            <Text style={styles.moodRecapEmoji}>{moodOption.emoji}</Text>
            <View>
              <Text style={styles.moodRecapTitle}>Trading Day: {moodOption.label}</Text>
              <Text style={styles.moodRecapSub}>
                {mood === 'great' && 'Everything clicked. Document what worked!'}
                {mood === 'good' && 'Solid day. Keep building on this.'}
                {mood === 'neutral' && 'Average day. Review and stay consistent.'}
                {mood === 'bad' && 'Tough day. Reflect on what to improve.'}
                {mood === 'terrible' && 'Hard session. Rest, review, reset.'}
              </Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Ionicons name={isEditing ? 'checkmark-circle' : 'create'} size={22} color={colors.white} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update Entry' : 'Save Entry'}
          </Text>
        </TouchableOpacity>

        {/* Delete Button (edit mode only) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.loss} />
            <Text style={styles.deleteButtonText}>Delete Entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: colors.loss,
  },
  moodLabel: {
    color: colors.primary,
    textTransform: 'none',
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMultiline: {
    height: 160,
    paddingTop: 12,
  },
  moodRecap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  moodRecapEmoji: {
    fontSize: 36,
  },
  moodRecapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  moodRecapSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  deleteButton: {
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
