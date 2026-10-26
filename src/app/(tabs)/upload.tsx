/**
 * Upload tab — photograph or pick a car photo, describe it and share it.
 */
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { PickerModal } from '@/components/PickerModal';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { CAR_MAKES, MAKE_NAMES } from '@/data/carMakes';
import { fetchDefaultVisibility, uploadSpot } from '@/services/spots';
import type { Visibility } from '@/types/database';

type PickedPhoto = { uri: string; width: number };

export default function UploadScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;

  // ---- Form state ----
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
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

  const pickPhoto = async (source: 'camera' | 'library') => {
    // Ask for permission first; the system shows its own dialog the first time.
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t(source === 'camera' ? 'upload.cameraDenied' : 'upload.libraryDenied'));
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true, // lets the user crop
      aspect: [4, 3],
      quality: 1, // we compress later in the spots service
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, width: asset.width });
      setError(null);
    }
  };

  const resetForm = () => {
    setPhoto(null);
    setMake(null);
    setModel(null);
    setYear('');
    setCity('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!userId) return;

    // ---- Validation ----
    if (!photo) return setError(t('upload.needPhoto'));
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
        imageUri: photo.uri,
        imageWidth: photo.width,
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
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ---- Photo ---- */}
        {photo ? (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" />
            <Pressable style={styles.changePhoto} onPress={() => pickPhoto('library')}>
              <Text style={styles.changePhotoText}>{t('upload.changePhoto')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <PhotoSourceButton icon="camera-outline" label={t('upload.takePhoto')} onPress={() => pickPhoto('camera')} />
            <PhotoSourceButton icon="images-outline" label={t('upload.chooseFromLibrary')} onPress={() => pickPhoto('library')} />
          </View>
        )}

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

        {/* ---- Visibility ---- */}
        <Text style={styles.label}>{t('upload.visibility')}</Text>
        <View style={styles.segment}>
          {(['public', 'friends'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setVisibility(option)}
              style={[styles.segmentItem, visibility === option && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, visibility === option && styles.segmentTextActive]}>
                {t(option === 'public' ? 'upload.public' : 'upload.friends')}
              </Text>
            </Pressable>
          ))}
        </View>

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

/** Big square button for choosing where the photo comes from. */
function PhotoSourceButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.photoButton} onPress={onPress}>
      <Ionicons name={icon} size={32} color={colors.primary} />
      <Text style={styles.photoButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  photoButtons: { flexDirection: 'row', gap: spacing.md },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  photoButtonText: { color: colors.text, fontWeight: '500', textAlign: 'center' },
  previewWrapper: { borderRadius: 16, overflow: 'hidden' },
  preview: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.card },
  changePhoto: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  changePhotoText: { color: '#fff', fontWeight: '600' },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, marginTop: -spacing.sm },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segmentText: { color: colors.textMuted, fontWeight: '500' },
  segmentTextActive: { color: colors.text, fontWeight: '600' },
  error: { color: colors.error },
});
