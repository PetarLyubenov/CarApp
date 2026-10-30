/**
 * A person's profile: name, bio, friend button, and their spots and garage.
 *
 * On your OWN profile you get "Edit profile", "Friends" and "Sign out" instead of
 * the friend button. On other profiles you only see what the database lets you see:
 * public items, plus "friends only" items once you are friends.
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CarCard } from '@/components/CarCard';
import { FriendButton } from '@/components/FriendButton';
import { SpotGridItem } from '@/components/SpotGridItem';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { fetchFriendLists, fetchFriendStatus, type FriendStatus } from '@/services/friends';
import { fetchCars, type CarSummary } from '@/services/garage';
import { fetchProfile } from '@/services/profiles';
import { fetchUserSpots, type FeedSpot } from '@/services/spots';
import type { Profile } from '@/types/database';

const COLUMNS = 3;
const GAP = 2;

type Tab = 'spots' | 'garage';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, signOut } = useAuth();
  const me = session?.user.id ?? '';
  const { width } = useWindowDimensions();
  const tileSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<FriendStatus>('none');
  const [spots, setSpots] = useState<FeedSpot[]>([]);
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [newRequests, setNewRequests] = useState(0);
  const [tab, setTab] = useState<Tab>('spots');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMe = id === me;

  const load = useCallback(() => {
    Promise.all([
      fetchProfile(id),
      fetchFriendStatus(me, id),
      fetchUserSpots(id),
      fetchCars(id),
      // Only your own profile shows how many requests are waiting.
      isMe ? fetchFriendLists(me).then((lists) => lists.incoming.length) : Promise.resolve(0),
    ])
      .then(([profileResult, statusResult, spotsResult, carsResult, requestCount]) => {
        setProfile(profileResult);
        setStatus(statusResult);
        setSpots(spotsResult);
        setCars(carsResult);
        setNewRequests(requestCount);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [id, me, isMe, t]);

  // Reload when coming back from "Edit profile" or the friends screen.
  useFocusEffect(load);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error ?? t('profile.notFound')}</Text>
      </View>
    );
  }

  const name = profile.display_name ?? profile.username;
  const badge =
    profile.role === 'admin'
      ? t('profile.admin')
      : profile.role === 'organization' && profile.is_verified
        ? t('profile.organization')
        : null;

  const header = (
    <View style={styles.header}>
      {/* ---- Who ---- */}
      <View style={styles.identity}>
        <Avatar name={profile.username} size={72} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.muted}>@{profile.username}</Text>
          {badge && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </View>
      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {/* ---- Actions ---- */}
      {isMe ? (
        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button title={t('profile.editProfile')} onPress={() => router.push('/profile/edit')} variant="secondary" />
          </View>
          <View style={styles.flex}>
            <Button
              title={newRequests > 0 ? t('profile.friendsWithRequests', { count: newRequests }) : t('profile.friends')}
              onPress={() => router.push('/friends')}
            />
          </View>
        </View>
      ) : (
        <FriendButton me={me} them={id} username={profile.username} status={status} onChange={load} />
      )}

      {/* ---- Spots / Garage switch ---- */}
      <View style={styles.tabs}>
        {(['spots', 'garage'] as const).map((value) => (
          <Pressable key={value} style={[styles.tab, tab === value && styles.tabActive]} onPress={() => setTab(value)}>
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>
              {t(`profile.${value}`)} · {value === 'spots' ? spots.length : cars.length}
            </Text>
          </Pressable>
        ))}
      </View>

      {!isMe && status !== 'friends' && <Text style={styles.hint}>{t('profile.hiddenHint')}</Text>}
    </View>
  );

  const footer = isMe ? (
    <View style={styles.footer}>
      <Button title={t('common.signOut')} onPress={signOut} variant="secondary" />
    </View>
  ) : undefined;

  return (
    <>
      <Stack.Screen options={{ title: isMe ? t('profile.myProfile') : `@${profile.username}` }} />
      {tab === 'spots' ? (
        // `key` makes React build a fresh list when switching tabs (numColumns can't change in place).
        <FlatList
          key="spots"
          style={styles.list}
          data={spots}
          keyExtractor={(spot) => spot.id}
          numColumns={COLUMNS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP }}
          renderItem={({ item }) => <SpotGridItem spot={item} size={tileSize} />}
          ListHeaderComponent={header}
          ListEmptyComponent={<Text style={styles.empty}>{t('profile.noSpots')}</Text>}
          ListFooterComponent={footer}
        />
      ) : (
        <FlatList
          key="garage"
          style={styles.list}
          data={cars}
          keyExtractor={(car) => car.id}
          contentContainerStyle={styles.carList}
          renderItem={({ item }) => (
            <View style={styles.carItem}>
              <CarCard car={item} />
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={<Text style={styles.empty}>{t('profile.noCars')}</Text>}
          ListFooterComponent={footer}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: { padding: spacing.md, gap: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 2 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  bio: { fontSize: 15, color: colors.text, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.background },
  tabText: { color: colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  carList: { paddingBottom: spacing.md },
  carItem: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  footer: { padding: spacing.md },
});
