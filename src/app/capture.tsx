/**
 * Quick photo — opened by the camera button right after taking a picture.
 * One short form for both kinds of car:
 *   - "Spotted car": shared as a spot (city + note)
 *   - "My car": added to your garage (nickname + note), without specs like fuel or drivetrain
 */
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { MakeModelFields, type MakeModel } from '@/components/MakeModelFields';
import { PhotoPicker } from '@/components/PhotoPicker';
import { TextField } from '@/components/TextField';
import { VisibilityToggle } from '@/components/VisibilityToggle';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { parseYear } from '@/lib/format';
import { createCar } from '@/services/garage';
import { MAX_PHOTOS, type LocalPhoto } from '@/services/photos';
import { fetchDefaultVisibility } from '@/services/profiles';
import { uploadSpot } from '@/services/spots';
import type { Visibility } from '@/types/database';

type Kind = 'spot' | 'car';

export default function CaptureScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  // The photo just taken arrives as route parameters (always strings).
  const { uri, width } = useLocalSearchParams<{ uri: string; width: string }>();

  const [kind, setKind] = useState<Kind>('spot');
  const [photos, setPhotos] = useState<LocalPhoto[]>(uri ? [{ uri, width: Number(width) || 0 }] : []);
  const [car, setCar] = useState<MakeModel>({ make: null, model: null });
  const [year, setYear] = useState('');
  const [city, setCity] = useState('');
  const [nickname, setNickname] = useState('');
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) fetchDefaultVisibility(userId).then(setVisibility).catch(() => {});
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    // ---- Validation ----
    if (photos.length === 0) return setError(t('upload.needPhoto'));
    const { make, model } = car;
    if (!make || !model) return setError(t('upload.needMakeModel'));
    const yearNumber = parseYear(year);
    if (yearNumber === 'invalid') return setError(t('upload.invalidYear'));

    // ---- Save ----
    setError(null);
    setSaving(true);
    try {
      if (kind === 'spot') {
        await uploadSpot({
          userId,
          photos,
          make,
          model,
          year: yearNumber,
          city: city.trim() || null,
          description: note.trim() || null,
          visibility,
        });
        Alert.alert(t('upload.success'));
        router.dismissTo('/'); // back to the Feed, which reloads when it gets focus
      } else {
        const id = await createCar({
          userId,
          photos,
          make,
          model,
          year: yearNumber,
          nickname: nickname.trim() || null,
          // The quick form skips the specs.
          engine: null,
          horsepower: null,
          fuelType: null,
          transmission: null,
          drivetrain: null,
          color: null,
          description: note.trim() || null,
          visibility,
        });
        Alert.alert(t('capture.carAdded'));
        // Replace this form with the new car, so "back" returns to where you started.
        router.replace({ pathname: '/garage/[id]', params: { id } });
      }
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ---- Spotted car / My car ---- */}
        <View style={styles.kinds}>
          <KindButton
            icon="eye-outline"
            label={t('capture.spotted')}
            selected={kind === 'spot'}
            onPress={() => setKind('spot')}
          />
          <KindButton
            icon="car-sport-outline"
            label={t('capture.myCar')}
            selected={kind === 'car'}
            onPress={() => setKind('car')}
          />
        </View>
        <Text style={styles.hint}>{kind === 'spot' ? t('capture.spottedHint') : t('capture.myCarHint')}</Text>

        <PhotoPicker photos={photos} onChange={setPhotos} max={MAX_PHOTOS} />

        {/* ---- What car is it? ---- */}
        <MakeModelFields value={car} onChange={setCar} />
        <TextField label={t('upload.year')} value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
        {kind === 'spot' ? (
          <TextField label={t('upload.city')} value={city} onChangeText={setCity} autoCapitalize="words" />
        ) : (
          <TextField
            label={t('garage.nickname')}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('garage.nicknamePlaceholder')}
            autoCapitalize="words"
          />
        )}
        <TextField
          label={t('capture.note')}
          value={note}
          onChangeText={setNote}
          multiline
          autoCapitalize="sentences"
          style={styles.multiline}
        />

        <VisibilityToggle value={visibility} onChange={setVisibility} />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title={kind === 'spot' ? t('capture.shareSpot') : t('capture.addToGarage')}
          onPress={handleSave}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** One of the two big "what is this photo?" buttons. */
function KindButton({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.kind, selected && styles.kindSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Ionicons name={icon} size={26} color={selected ? '#fff' : colors.textMuted} />
      <Text style={[styles.kindText, selected && styles.kindTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  kinds: { flexDirection: 'row', gap: spacing.sm },
  kind: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  kindSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  kindText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  kindTextSelected: { color: '#fff' },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: -spacing.xs },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.error },
});
