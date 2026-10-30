/**
 * Car details: photos, specs and the history of modifications.
 * The owner also sees buttons to add/delete mods and to delete the car.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { formatDate, formatEuro } from '@/lib/format';
import { deleteCar, deleteModification, fetchCar, type CarDetails } from '@/services/garage';
import type { Modification } from '@/types/database';

export default function CarScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    fetchCar(id)
      .then((result) => {
        setCar(result);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [id, t]);

  // Reload when coming back from "Add modification".
  useFocusEffect(load);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error ?? t('garage.notFound')}</Text>
      </View>
    );
  }

  const isOwner = session?.user.id === car.user_id;
  const name = [car.year, car.make, car.model].filter(Boolean).join(' ');

  // Translate stored codes like "manual" / "rwd"; show anything else as typed.
  const translated = (group: string, value: string | null) =>
    value && i18n.exists(`${group}.${value}`) ? t(`${group}.${value}`) : value;

  const specs: [string, string | null][] = [
    [t('garage.fuelType'), translated('fuelTypes', car.fuel_type)],
    [t('garage.engine'), car.engine],
    [t('garage.horsepower'), car.horsepower ? `${car.horsepower} hp` : null],
    [t('garage.transmission'), translated('transmissions', car.transmission)],
    [t('garage.drivetrain'), translated('drivetrains', car.drivetrain)],
    [t('garage.color'), car.color],
  ];
  const filledSpecs = specs.filter(([, value]) => value);

  const totalSpent = car.modifications.reduce((sum, mod) => sum + (mod.cost ?? 0), 0);

  const confirmDeleteCar = () => {
    Alert.alert(t('garage.deleteCar'), t('garage.deleteCarConfirm'), [
      { text: t('garage.cancel'), style: 'cancel' },
      {
        text: t('garage.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteCar(car);
            router.back();
          } catch (e) {
            setDeleting(false);
            Alert.alert(getErrorMessage(e, t('common.error')));
          }
        },
      },
    ]);
  };

  const confirmDeleteMod = (mod: Modification) => {
    Alert.alert(mod.title, t('garage.deleteModConfirm'), [
      { text: t('garage.cancel'), style: 'cancel' },
      {
        text: t('garage.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModification(mod.id);
            load();
          } catch (e) {
            Alert.alert(getErrorMessage(e, t('common.error')));
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: car.nickname ?? `${car.make} ${car.model}` }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {car.imageUrls.length > 0 && <PhotoCarousel urls={car.imageUrls} />}

        <View style={styles.body}>
          {/* ---- Title ---- */}
          <View>
            {car.nickname && <Text style={styles.nickname}>{car.nickname}</Text>}
            <Text style={styles.name}>{name}</Text>
            <Pressable onPress={() => router.push({ pathname: '/profile/[id]', params: { id: car.user_id } })}>
              <Text style={styles.link}>{t('garage.owner', { username: car.username })}</Text>
            </Pressable>
          </View>

          {car.description && <Text style={styles.description}>{car.description}</Text>}

          {/* ---- Specs ---- */}
          {filledSpecs.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('garage.specs')}</Text>
              {filledSpecs.map(([label, value]) => (
                <View key={label} style={styles.specRow}>
                  <Text style={styles.specLabel}>{label}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ---- Modifications ---- */}
          <View style={styles.modsHeader}>
            <Text style={styles.sectionTitle}>{t('garage.modifications')}</Text>
            {totalSpent > 0 && (
              <Text style={styles.muted}>{t('garage.totalSpent', { amount: formatEuro(totalSpent) })}</Text>
            )}
          </View>

          {car.modifications.length === 0 ? (
            <Text style={styles.muted}>{t('garage.noMods')}</Text>
          ) : (
            car.modifications.map((mod) => (
              <ModRow key={mod.id} mod={mod} onDelete={isOwner ? () => confirmDeleteMod(mod) : undefined} />
            ))
          )}

          {isOwner && (
            <View style={styles.ownerButtons}>
              <Button
                title={t('garage.addMod')}
                onPress={() => router.push({ pathname: '/garage/[id]/add-mod', params: { id: car.id } })}
              />
              <Button title={t('garage.deleteCar')} onPress={confirmDeleteCar} variant="secondary" loading={deleting} />
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

/** One modification: category, title, date, cost and details. */
function ModRow({ mod, onDelete }: { mod: Modification; onDelete?: () => void }) {
  const { t } = useTranslation();
  const meta = [
    mod.installed_on ? formatDate(mod.installed_on) : null,
    mod.cost != null ? formatEuro(Number(mod.cost)) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.mod}>
      <View style={styles.modTop}>
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{t(`modCategories.${mod.category}`)}</Text>
        </View>
        {onDelete && (
          <Pressable onPress={onDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <Text style={styles.modTitle}>{mod.title}</Text>
      {meta ? <Text style={styles.muted}>{meta}</Text> : null}
      {mod.description && <Text style={styles.description}>{mod.description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  body: { padding: spacing.md, gap: spacing.md },
  nickname: { fontSize: 14, fontWeight: '600', color: colors.primary },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  description: { fontSize: 15, color: colors.text, lineHeight: 21 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  specLabel: { fontSize: 15, color: colors.textMuted },
  specValue: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right' },
  modsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  mod: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  modTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  modTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  ownerButtons: { gap: spacing.sm, marginTop: spacing.md },
});
