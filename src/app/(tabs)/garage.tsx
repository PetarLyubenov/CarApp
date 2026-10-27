/**
 * Garage tab — the signed-in user's own cars.
 * Tap a car to see its specs and modifications; "Add car" opens the form.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { fetchCars, type CarSummary } from '@/services/garage';

export default function GarageScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const userId = session?.user.id;

  const [cars, setCars] = useState<CarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reload whenever the tab is shown — e.g. after adding or deleting a car.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      fetchCars(userId)
        .then((result) => {
          setCars(result);
          setError(null);
        })
        .catch((e) => setError(getErrorMessage(e, t('common.error'))))
        .finally(() => setLoading(false));
    }, [userId, t]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={cars}
      keyExtractor={(car) => car.id}
      renderItem={({ item }) => <CarRow car={item} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="car-sport-outline" size={56} color={colors.primary} />
          <Text style={error ? styles.error : styles.emptyText}>{error ?? t('garage.empty')}</Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.footer}>
          <Button title={t('garage.addCar')} onPress={() => router.push('/garage/new')} />
          {/* Temporary, until we add a profile/settings screen */}
          <Button title={t('common.signOut')} onPress={signOut} variant="secondary" />
        </View>
      }
    />
  );
}

/** One car in the list: cover photo, name and a short summary. */
function CarRow({ car }: { car: CarSummary }) {
  const { t } = useTranslation();
  const name = [car.year, car.make, car.model].filter(Boolean).join(' ');
  const details = [
    car.horsepower ? `${car.horsepower} hp` : null,
    t('garage.mods', { count: car.modsCount }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/garage/[id]', params: { id: car.id } })}
    >
      {car.imageUrls[0] ? (
        <Image source={{ uri: car.imageUrls[0] }} style={styles.cover} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.cover, styles.noPhoto]}>
          <Ionicons name="car-sport" size={48} color={colors.border} />
        </View>
      )}
      <View style={styles.cardBody}>
        {car.nickname && <Text style={styles.nickname}>{car.nickname}</Text>}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.details}>{details}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  error: { color: colors.error, textAlign: 'center' },
  footer: { gap: spacing.sm, marginTop: spacing.sm },
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.md, gap: 2 },
  nickname: { fontSize: 13, fontWeight: '600', color: colors.primary },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  details: { fontSize: 14, color: colors.textMuted },
});
