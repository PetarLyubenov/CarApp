/**
 * Upload tab — photograph or pick car photos, describe the car and share it.
 */
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { PhotoPicker } from '@/components/PhotoPicker';
import { MakeModelFields, type MakeModel } from '@/components/MakeModelFields';
import { TextField } from '@/components/TextField';
import { VisibilityToggle } from '@/components/VisibilityToggle';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { parseYear } from '@/lib/format';
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
  const [car, setCar] = useState<MakeModel>({ make: null, model: null });
  const [year, setYear] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');

  // ---- UI state ----
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
    setCar({ make: null, model: null });
    setYear('');
    setCity('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!userId) return;

    // ---- Validation ----
    if (photos.length === 0) return setError(t('upload.needPhoto'));
    const { make, model } = car;
    if (!make || !model) return setError(t('upload.needMakeModel'));

    const yearNumber = parseYear(year);
    if (yearNumber === 'invalid') return setError(t('upload.invalidYear'));

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
        <MakeModelFields value={car} onChange={setCar} />
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

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.error },
});
