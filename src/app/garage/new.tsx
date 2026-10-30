/**
 * Add a car to your garage: photos, make/model, specs and who can see it.
 */
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ChipSelect } from '@/components/ChipSelect';
import { PhotoPicker } from '@/components/PhotoPicker';
import { MakeModelFields, type MakeModel } from '@/components/MakeModelFields';
import { TextField } from '@/components/TextField';
import { VisibilityToggle } from '@/components/VisibilityToggle';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { parseYear } from '@/lib/format';
import { createCar } from '@/services/garage';
import { MAX_PHOTOS, type LocalPhoto } from '@/services/photos';
import { fetchDefaultVisibility } from '@/services/profiles';
import type { FuelType, Visibility } from '@/types/database';

// Stored in the database as these short codes; shown translated.
// Same values as the check in supabase/fuel_type.sql.
const FUEL_TYPES: FuelType[] = [
  'petrol',
  'diesel',
  'hybrid',
  'plugin_hybrid',
  'mild_hybrid',
  'electric',
  'lpg',
  'cng',
  'hydrogen',
];
const TRANSMISSIONS = ['manual', 'automatic', 'dct', 'cvt'] as const;
const DRIVETRAINS = ['fwd', 'rwd', 'awd', '4wd'] as const;
type Transmission = (typeof TRANSMISSIONS)[number];
type Drivetrain = (typeof DRIVETRAINS)[number];

export default function NewCarScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;

  // ---- Form state ----
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [car, setCar] = useState<MakeModel>({ make: null, model: null });
  const [year, setYear] = useState('');
  const [nickname, setNickname] = useState('');
  const [engine, setEngine] = useState('');
  const [horsepower, setHorsepower] = useState('');
  const [fuelType, setFuelType] = useState<FuelType | null>(null);
  const [transmission, setTransmission] = useState<Transmission | null>(null);
  const [drivetrain, setDrivetrain] = useState<Drivetrain | null>(null);
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');

  // ---- UI state ----
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) fetchDefaultVisibility(userId).then(setVisibility).catch(() => {});
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    // ---- Validation ----
    const { make, model } = car;
    if (!make || !model) return setError(t('upload.needMakeModel'));

    const yearNumber = parseYear(year);
    if (yearNumber === 'invalid') return setError(t('upload.invalidYear'));

    let hp: number | null = null;
    if (horsepower.trim()) {
      hp = Number(horsepower);
      if (!Number.isInteger(hp) || hp <= 0) return setError(t('garage.invalidHorsepower'));
    }

    // ---- Save ----
    setError(null);
    setSaving(true);
    try {
      const id = await createCar({
        userId,
        photos,
        make,
        model,
        year: yearNumber,
        nickname: nickname.trim() || null,
        engine: engine.trim() || null,
        horsepower: hp,
        fuelType,
        transmission,
        drivetrain,
        color: color.trim() || null,
        description: description.trim() || null,
        visibility,
      });
      // Replace (not push) so "back" from the new car goes to the garage, not this form.
      router.replace({ pathname: '/garage/[id]', params: { id } });
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ---- Photos ---- */}
        <Text style={styles.section}>{t('garage.photosOptional')}</Text>
        <PhotoPicker photos={photos} onChange={setPhotos} max={MAX_PHOTOS} />

        {/* ---- Car ---- */}
        <MakeModelFields value={car} onChange={setCar} />
        <TextField label={t('upload.year')} value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
        <TextField
          label={t('garage.nickname')}
          placeholder={t('garage.nicknamePlaceholder')}
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="sentences"
        />

        {/* ---- Specs (all optional) ---- */}
        <Text style={styles.section}>{t('garage.specs')}</Text>
        <ChipSelect
          label={t('garage.fuelType')}
          options={FUEL_TYPES.map((value) => ({ value, label: t(`fuelTypes.${value}`) }))}
          value={fuelType}
          onChange={setFuelType}
        />
        <TextField
          label={t('garage.engine')}
          placeholder={t('garage.enginePlaceholder')}
          value={engine}
          onChangeText={setEngine}
          autoCapitalize="sentences"
        />
        <TextField
          label={t('garage.horsepower')}
          value={horsepower}
          onChangeText={setHorsepower}
          keyboardType="number-pad"
          maxLength={4}
        />
        <ChipSelect
          label={t('garage.transmission')}
          options={TRANSMISSIONS.map((value) => ({ value, label: t(`transmissions.${value}`) }))}
          value={transmission}
          onChange={setTransmission}
        />
        <ChipSelect
          label={t('garage.drivetrain')}
          options={DRIVETRAINS.map((value) => ({ value, label: t(`drivetrains.${value}`) }))}
          value={drivetrain}
          onChange={setDrivetrain}
        />
        <TextField label={t('garage.color')} value={color} onChangeText={setColor} autoCapitalize="words" />
        <TextField
          label={t('garage.about')}
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="sentences"
          style={styles.multiline}
        />

        <VisibilityToggle value={visibility} onChange={setVisibility} />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title={t('garage.saveCar')} onPress={handleSave} loading={saving} />
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.error },
});
