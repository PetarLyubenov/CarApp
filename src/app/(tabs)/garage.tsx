/**
 * Garage tab — the signed-in user's own cars.
 * Tap a car to see its specs and modifications; "Add car" opens the form.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { CarCard } from '@/components/CarCard';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { fetchCars, type CarSummary } from '@/services/garage';

export default function GarageScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
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
      renderItem={({ item }) => <CarCard car={item} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="car-sport-outline" size={56} color={colors.primary} />
          <Text style={error ? styles.error : styles.emptyText}>{error ?? t('garage.empty')}</Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.footer}>
          <Button title={t('garage.addCar')} onPress={() => router.push('/garage/new')} />
        </View>
      }
    />
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
});
