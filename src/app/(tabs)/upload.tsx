/**
 * Upload tab — photograph or pick car photos, describe the car and share it.
 */
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { PhotoPicker } from '@/components/PhotoPicker';
import { PickerModal } from '@/components/PickerModal';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { VisibilityToggle } from '@/components/VisibilityToggle';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { CAR_MAKES, MAKE_NAMES } from '@/data/carMakes';
import { getErrorMessage } from '@/lib/errors';
import { MAX_PHOTOS, type LocalPhoto } from '@/services/photos';
import { fetchDefaultVisibility } from '@/services/profiles';
import { uploadSpot } from '@/services/spots';
import type { Visibility } from '@/types/database';

export default function UploadScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;

  // ---- Form state ----
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [make, setMake] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [year, setYear] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');

  // ---- UI state ----
  const [openPicker, setOpenPicker] = useState<'make' | 'model' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Pre-select the visibility the user chose as default in their profile.
  useEffect(() => {
    if (userId) {
      fetchDefaultVisibility(userId).then(setVisibility).catch(() => {});
    }
  }, [userId]);

  const resetForm = () => {
    setPhotos([]);
    setMake(null);
    setModel(null);
    setYear('');
    setCity('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!userId) return;

    // ---- Validation ----
    if (photos.length === 0) return setError(t('upload.needPhoto'));
    if (!make || !model) return setError(t('upload.needMakeModel'));

    let yearNumber: number | null = null;
    if (year.trim()) {
      yearNumber = Number(year);
      const maxYear = new Date().getFullYear() + 1;
      if (!Number.isInteger(yearNumber) || yearNumber < 1886 || yearNumber > maxYear) {
        return setError(t('upload.invalidYear'));
      }
    }

    // ---- Upload ----
    setError(null);
    setUploading(true);
    try {
      await uploadSpot({
        userId,
        photos,
        make,
        model,
        year: yearNumber,
        city: city.trim() || null,
        description: description.trim() || null,
        visibility,
      });
      resetForm();
      Alert.alert(t('upload.success'));
      router.navigate('/'); // go to the Feed, which reloads when it gets focus
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ---- Photos ---- */}
        <PhotoPicker photos={photos} onChange={setPhotos} max={MAX_PHOTOS} />

        {/* ---- Car ---- */}
        <SelectField
          label={t('upload.make')}
          value={make}
          placeholder={t('upload.selectMake')}
          onPress={() => setOpenPicker('make')}
        />
        <SelectField
          label={t('upload.model')}
          value={model}
          placeholder={make ? t('upload.selectModel') : t('upload.selectMakeFirst')}
          onPress={() => setOpenPicker('model')}
          disabled={!make}
        />
        <TextField label={t('upload.year')} value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
        <TextField label={t('upload.city')} value={city} onChangeText={setCity} autoCapitalize="words" />
        <TextField
          label={t('upload.description')}
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="sentences"
          style={styles.multiline}
        />

        <VisibilityToggle value={visibility} onChange={setVisibility} />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title={t('upload.submit')} onPress={handleSubmit} loading={uploading} />
      </ScrollView>

      {/* ---- Pickers (hidden until opened) ---- */}
      <PickerModal
        visible={openPicker === 'make'}
        title={t('upload.selectMake')}
        options={MAKE_NAMES}
        allowCustom
        onClose={() => setOpenPicker(null)}
        onSelect={(value) => {
          if (value !== make) setModel(null); // a new make invalidates the old model
          setMake(value);
          setOpenPicker(null);
        }}
      />
      <PickerModal
        visible={openPicker === 'model'}
        title={t('upload.selectModel')}
        options={make ? (CAR_MAKES[make] ?? []) : []}
        allowCustom
        onClose={() => setOpenPicker(null)}
        onSelect={(value) => {
          setModel(value);
          setOpenPicker(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.error },
});
