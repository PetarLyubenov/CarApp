/**
 * Feed tab — newest spotted cars the user is allowed to see.
 * Reloads every time the tab is opened, and with pull-to-refresh.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SpotCard } from '@/components/SpotCard';
import { colors, spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { fetchFeed, type FeedSpot } from '@/services/spots';

export default function FeedScreen() {
  const { t } = useTranslation();
  const [spots, setSpots] = useState<FeedSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSpots(await fetchFeed());
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  // Runs when the tab comes into view — e.g. right after uploading a new spot.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // FlatList only renders the rows that are on screen — important for long feeds.
  return (
    <FlatList
      style={styles.list}
      data={spots}
      keyExtractor={(spot) => spot.id}
      renderItem={({ item }) => <SpotCard spot={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={spots.length === 0 ? styles.center : undefined}
      ListEmptyComponent={
        <Text style={error ? styles.error : styles.empty}>{error ?? t('feed.empty')}</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  empty: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  error: { color: colors.error, textAlign: 'center' },
});
