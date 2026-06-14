import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { colors } from '../theme/colors';
import { Trade, AssetType, TradeDirection, TradeStatus, ASSET_TYPES, ASSET_ICONS } from '../types';
import { insertTrade, updateTrade, getTradeById } from '../database/database';
import { TradesStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<TradesStackParamList, 'EditTrade'>;

const TODAY = new Date().toISOString().split('T')[0];

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  autoCapitalize = 'none',
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  autoCapitalize?: any;
  required?: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function AddTradeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const editId = (route.params as any)?.tradeId as string | undefined;
  const isEditing = !!editId;

  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('Stocks');
  const [direction, setDirection] = useState<TradeDirection>('Long');
  const [status, setStatus] = useState<TradeStatus>('Closed');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fees, setFees] = useState('0');
  const [entryDate, setEntryDate] = useState(TODAY);
  const [exitDate, setExitDate] = useState(TODAY);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && editId) {
      const trade = getTradeById(editId);
      if (trade) {
        setSymbol(trade.symbol);
        setAssetType(trade.assetType);
        setDirection(trade.direction);
        setStatus(trade.status);
        setEntryPrice(String(trade.entryPrice));
        setExitPrice(trade.exitPrice !== undefined ? String(trade.exitPrice) : '');
        setQuantity(String(trade.quantity));
        setFees(String(trade.fees));
        setEntryDate(trade.entryDate);
        setExitDate(trade.exitDate ?? TODAY);
        setTags(trade.tags.join(', '));
        setNotes(trade.notes);
        setScreenshotUri(trade.screenshotUri);
      }
    }
  }, [editId, isEditing]);

  const calcPnl = (): number | null => {
    const ep = parseFloat(entryPrice);
    const ex = parseFloat(exitPrice);
    const qty = parseFloat(quantity);
    const fee = parseFloat(fees) || 0;
    if (!ep || !ex || !qty || status === 'Open') return null;
    const raw = direction === 'Long' ? (ex - ep) * qty : (ep - ex) * qty;
    return raw - fee;
  };

  const pnl = calcPnl();

  const pickImage = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const validate = (): string | null => {
    if (!symbol.trim()) return 'Symbol is required.';
    if (!entryPrice || isNaN(parseFloat(entryPrice))) return 'Valid entry price is required.';
    if (!quantity || isNaN(parseFloat(quantity))) return 'Valid quantity is required.';
    if (status === 'Closed' && (!exitPrice || isNaN(parseFloat(exitPrice)))) {
      return 'Exit price is required for closed trades.';
    }
    if (!entryDate.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Entry date must be YYYY-MM-DD.';
    if (status === 'Closed' && !exitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return 'Exit date must be YYYY-MM-DD.';
    }
    return null;
  };

  const handleSave = () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const trade: Trade = {
      id: isEditing && editId ? editId : uuidv4(),
      symbol: symbol.trim().toUpperCase(),
      assetType,
      direction,
      status,
      entryPrice: parseFloat(entryPrice),
      exitPrice: status === 'Closed' ? parseFloat(exitPrice) : undefined,
      quantity: parseFloat(quantity),
      fees: parseFloat(fees) || 0,
      entryDate,
      exitDate: status === 'Closed' ? exitDate : undefined,
      tags: parsedTags,
      notes,
      screenshotUri,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (isEditing) {
        updateTrade(trade);
      } else {
        insertTrade(trade);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save trade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
        {/* Symbol */}
        <InputField
          label="Symbol"
          value={symbol}
          onChangeText={(t) => setSymbol(t.toUpperCase())}
          placeholder="e.g. AAPL, BTC/USD, EUR/USD"
          autoCapitalize="characters"
          required
        />

        {/* Asset Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Asset Type <Text style={styles.required}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {ASSET_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, assetType === type && styles.chipActive]}
                  onPress={() => setAssetType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipEmoji}>{ASSET_ICONS[type]}</Text>
                  <Text style={[styles.chipText, assetType === type && styles.chipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Direction */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Direction <Text style={styles.required}>*</Text></Text>
          <View style={styles.toggleRow}>
            {(['Long', 'Short'] as TradeDirection[]).map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.toggleButton,
                  direction === d && (d === 'Long' ? styles.toggleLong : styles.toggleShort),
                ]}
                onPress={() => setDirection(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleText,
                    direction === d && styles.toggleTextActive,
                  ]}
                >
                  {d === 'Long' ? '▲ Long' : '▼ Short'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, status === 'Open' && styles.switchLabelActive]}>
              Open
            </Text>
            <Switch
              value={status === 'Closed'}
              onValueChange={(v) => setStatus(v ? 'Closed' : 'Open')}
              trackColor={{ false: colors.accentBackground, true: colors.primary }}
              thumbColor={colors.white}
            />
            <Text style={[styles.switchLabel, status === 'Closed' && styles.switchLabelActive]}>
              Closed
            </Text>
          </View>
        </View>

        {/* Prices Row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <InputField
              label="Entry Price"
              value={entryPrice}
              onChangeText={setEntryPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              required
            />
          </View>
          <View style={styles.rowGap} />
          <View style={styles.halfField}>
            <InputField
              label={`Exit Price${status === 'Open' ? ' (optional)' : ''}`}
              value={exitPrice}
              onChangeText={setExitPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              required={status === 'Closed'}
            />
          </View>
        </View>

        {/* Quantity & Fees Row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <InputField
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="decimal-pad"
              required
            />
          </View>
          <View style={styles.rowGap} />
          <View style={styles.halfField}>
            <InputField
              label="Fees"
              value={fees}
              onChangeText={setFees}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Dates Row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <InputField
              label="Entry Date"
              value={entryDate}
              onChangeText={setEntryDate}
              placeholder="YYYY-MM-DD"
              required
            />
          </View>
          {status === 'Closed' && (
            <>
              <View style={styles.rowGap} />
              <View style={styles.halfField}>
                <InputField
                  label="Exit Date"
                  value={exitDate}
                  onChangeText={setExitDate}
                  placeholder="YYYY-MM-DD"
                  required
                />
              </View>
            </>
          )}
        </View>

        {/* P&L Preview */}
        {pnl !== null && (
          <View style={[styles.pnlPreview, { borderColor: pnl >= 0 ? colors.profit : colors.loss }]}>
            <Text style={styles.pnlPreviewLabel}>Estimated P&L</Text>
            <Text style={[styles.pnlPreviewValue, { color: pnl >= 0 ? colors.profit : colors.loss }]}>
              {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
            </Text>
          </View>
        )}

        {/* Tags */}
        <InputField
          label="Tags (comma separated)"
          value={tags}
          onChangeText={setTags}
          placeholder="e.g. breakout, earnings, swing"
        />

        {/* Notes */}
        <InputField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Trade rationale, what went well, lessons learned..."
          multiline
        />

        {/* Screenshot */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Chart Screenshot</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
            {screenshotUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: screenshotUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setScreenshotUri(undefined)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.loss} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePickerEmpty}>
                <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.imagePickerText}>Tap to add screenshot</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Ionicons name={isEditing ? 'checkmark-circle' : 'add-circle'} size={22} color={colors.white} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update Trade' : 'Save Trade'}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 16,
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
    height: 100,
    paddingTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  toggleLong: {
    borderColor: colors.profit,
    backgroundColor: colors.profitBackground,
  },
  toggleShort: {
    borderColor: colors.loss,
    backgroundColor: colors.lossBackground,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  switchLabelActive: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  halfField: {
    flex: 1,
  },
  rowGap: {
    width: 12,
  },
  pnlPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  pnlPreviewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pnlPreviewValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  imagePicker: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.card,
  },
  imagePickerEmpty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
