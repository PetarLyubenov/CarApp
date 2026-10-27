/**
 * Choose several photos: from the camera one at a time, or many at once from the library.
 * Shows the cover (first photo) large and all photos as thumbnails underneath.
 * Tap a thumbnail to make it the cover; tap ✕ to remove it.
 */
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';
import type { LocalPhoto } from '@/services/spots';

type Props = {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  max: number;
};

export function PhotoPicker({ photos, onChange, max }: Props) {
  const { t } = useTranslation();
  const remaining = max - photos.length;

  const addPhotos = async (source: 'camera' | 'library') => {
    if (remaining <= 0) {
      Alert.alert(t('upload.maxPhotos', { max }));
      return;
    }

    // Ask for permission first; the system shows its own dialog the first time.
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t(source === 'camera' ? 'upload.cameraDenied' : 'upload.libraryDenied'));
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true, // lets the user crop the shot
            aspect: [4, 3],
            quality: 1, // compressed later in the spots service
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            // Cropping isn't available when picking several photos at once.
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            orderedSelection: true, // keep the order the user tapped them in
            quality: 1,
          });

    if (!result.canceled) {
      const picked = result.assets.map((asset) => ({ uri: asset.uri, width: asset.width }));
      // slice() guards against platforms that ignore selectionLimit.
      onChange([...photos, ...picked].slice(0, max));
    }
  };

  const remove = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  // Move the tapped photo to the front: the first photo is the cover.
  const makeCover = (index: number) => {
    if (index === 0) return;
    const reordered = [...photos];
    const [chosen] = reordered.splice(index, 1);
    onChange([chosen, ...reordered]);
  };

  // ---- No photos yet: two big buttons ----
  if (photos.length === 0) {
    return (
      <View style={styles.bigButtons}>
        <SourceButton icon="camera-outline" label={t('upload.takePhoto')} onPress={() => addPhotos('camera')} big />
        <SourceButton icon="images-outline" label={t('upload.chooseFromLibrary')} onPress={() => addPhotos('library')} big />
      </View>
    );
  }

  // ---- Cover + thumbnails ----
  return (
    <View style={styles.container}>
      <Image source={{ uri: photos[0].uri }} style={styles.cover} contentFit="cover" />

      <View style={styles.row}>
        <Text style={styles.hint}>{t('upload.coverHint')}</Text>
        <Text style={styles.counter}>
          {photos.length}/{max}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {photos.map((photo, index) => (
          <Pressable key={photo.uri} onPress={() => makeCover(index)}>
            <Image
              source={{ uri: photo.uri }}
              style={[styles.thumb, index === 0 && styles.thumbCover]}
              contentFit="cover"
            />
            <Pressable style={styles.remove} onPress={() => remove(index)} hitSlop={8}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </Pressable>
        ))}

        {remaining > 0 && (
          <>
            <SourceButton icon="camera-outline" label={t('upload.camera')} onPress={() => addPhotos('camera')} />
            <SourceButton icon="images-outline" label={t('upload.library')} onPress={() => addPhotos('library')} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/** Button for choosing where photos come from: big when empty, thumbnail-sized otherwise. */
function SourceButton({
  icon,
  label,
  onPress,
  big = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  big?: boolean;
}) {
  return (
    <Pressable style={big ? styles.bigButton : styles.smallButton} onPress={onPress}>
      <Ionicons name={icon} size={big ? 32 : 22} color={colors.primary} />
      <Text style={big ? styles.bigButtonText : styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

const THUMB = 72;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  cover: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: colors.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { fontSize: 13, color: colors.textMuted, flex: 1 },
  counter: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  strip: { gap: spacing.sm, paddingTop: 6, paddingRight: 6 }, // room for the ✕ badges
  thumb: { width: THUMB, height: THUMB, borderRadius: 10, backgroundColor: colors.card },
  thumbCover: { borderWidth: 3, borderColor: colors.primary },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButtons: { flexDirection: 'row', gap: spacing.md },
  bigButton: {
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
  bigButtonText: { color: colors.text, fontWeight: '500', textAlign: 'center' },
  smallButton: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  smallButtonText: { fontSize: 11, color: colors.text },
});
