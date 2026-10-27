/**
 * Spot details — opened from search results (later also from profiles and links).
 * `[id]` in the file name makes it a dynamic route: /spot/<spot id>.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SpotCard } from '@/components/SpotCard';
import { colors, spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { fetchSpot, type FeedSpot } from '@/services/spots';

export default function SpotScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [spot, setSpot] = useState<FeedSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpot(id)
      .then(setSpot)
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [id, t]);

  // The header title becomes the car name once it's loaded.
  const title = spot ? `${spot.make} ${spot.model}` : '';

  return (
    <>
      <Stack.Screen options={{ title }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : spot ? (
        <ScrollView style={styles.container}>
          <SpotCard spot={spot} />
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.message}>{error ?? t('spot.notFound')}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  message: { color: colors.textMuted, textAlign: 'center' },
});
