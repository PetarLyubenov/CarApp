/**
 * Add a modification to a car. Opens as a sheet over the car screen.
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ChipSelect } from '@/components/ChipSelect';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { addModification } from '@/services/garage';
import type { ModCategory } from '@/types/database';

// Same order and values as the `mod_category` enum in supabase/schema.sql.
const CATEGORIES: ModCategory[] = [
  'engine',
  'exhaust',
  'suspension',
  'wheels',
  'brakes',
  'interior',
  'exterior',
  'electronics',
  'other',
];

/** True for a real calendar date written as YYYY-MM-DD (rejects e.g. 2025-02-30). */
function isValidDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text);
}

export default function AddModScreen() {
  const { t } = useTranslation();
  const { id: carId } = useLocalSearchParams<{ id: string }>();

  const [category, setCategory] = useState<ModCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [installedOn, setInstalledOn] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // ---- Validation ----
    if (!category) return setError(t('garage.needCategory'));
    if (!title.trim()) return setError(t('garage.needTitle'));
    if (installedOn.trim() && !isValidDate(installedOn.trim())) return setError(t('garage.invalidDate'));

    let costNumber: number | null = null;
    if (cost.trim()) {
      // Accept both "450.50" and "450,50" (comma is common in Bulgaria).
      costNumber = Number(cost.trim().replace(',', '.'));
      if (!Number.isFinite(costNumber) || costNumber < 0) return setError(t('garage.invalidCost'));
    }

    // ---- Save ----
    setError(null);
    setSaving(true);
    try {
      await addModification({
        carId,
        category,
        title: title.trim(),
        description: description.trim() || null,
        installedOn: installedOn.trim() || null,
        cost: costNumber,
      });
      router.back(); // the car screen reloads when it comes back into view
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ChipSelect
          label={t('garage.category')}
          options={CATEGORIES.map((value) => ({ value, label: t(`modCategories.${value}`) }))}
          value={category}
          onChange={setCategory}
        />
        <TextField
          label={t('garage.modTitle')}
          placeholder={t('garage.modTitlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
        />
        <TextField
          label={t('garage.installedOn')}
          placeholder="2025-06-15"
          value={installedOn}
          onChangeText={setInstalledOn}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <TextField
          label={t('garage.cost')}
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('garage.modDescription')}
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="sentences"
          style={styles.multiline}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title={t('garage.saveMod')} onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.error },
});
