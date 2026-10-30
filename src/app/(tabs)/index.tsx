/**
 * Feed tab — newest spotted cars the user is allowed to see.
 * "Everyone" shows all visible spots; "Friends" only yours and your friends'.
 * Reloads every time the tab is opened, and with pull-to-refresh.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SpotCard } from '@/components/SpotCard';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { fetchFriendIds } from '@/services/friends';
import { fetchFeed, type FeedSpot } from '@/services/spots';

type Filter = 'everyone' | 'friends';

export default function FeedScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const me = session?.user.id ?? '';

  const [filter, setFilter] = useState<Filter>('everyone');
  const [spots, setSpots] = useState<FeedSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      // For "Friends", first get the friend ids, then ask only for their spots (plus your own).
      const onlyUserIds = filter === 'friends' ? [me, ...(await fetchFriendIds(me))] : undefined;
      setSpots(await fetchFeed({ onlyUserIds }));
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, me, t]);

  // Runs when the tab comes into view (e.g. right after uploading) and when the filter changes.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const changeFilter = (value: Filter) => {
    if (value === filter) return;
    setLoading(true);
    setFilter(value);
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const emptyText = filter === 'friends' ? t('feed.noFriendSpots') : t('feed.empty');

  return (
    <View style={styles.container}>
      {/* ---- Everyone / Friends switch ---- */}
      <View style={styles.tabs}>
        {(['everyone', 'friends'] as const).map((value) => (
          <Pressable
            key={value}
            style={[styles.tab, filter === value && styles.tabActive]}
            onPress={() => changeFilter(value)}
          >
            <Text style={[styles.tabText, filter === value && styles.tabTextActive]}>
              {value === 'everyone' ? t('feed.everyone') : t('feed.friendsTab')}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        // FlatList only renders the rows that are on screen — important for long feeds.
        <FlatList
          style={styles.list}
          data={spots}
          keyExtractor={(spot) => spot.id}
          renderItem={({ item }) => <SpotCard spot={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={spots.length === 0 ? styles.center : undefined}
          ListEmptyComponent={<Text style={error ? styles.error : styles.empty}>{error ?? emptyText}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  empty: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  error: { color: colors.error, textAlign: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
});
