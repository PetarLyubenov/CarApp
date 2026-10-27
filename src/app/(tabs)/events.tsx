/**
 * Events tab — upcoming car shows, meets and track days.
 *
 * What you see on top depends on your role:
 *   - verified organization / admin: "Create event"
 *   - admin: also "Organizer applications"
 *   - everyone else: an invitation to apply as organizer (or the status of their application)
 */
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { EventCard } from '@/components/EventCard';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { fetchUpcomingEvents, type EventItem } from '@/services/events';
import { canCreateEvents, fetchMyLatestRequest, fetchMyProfile } from '@/services/organizations';
import type { EventType, OrganizationRequest, Profile } from '@/types/database';

const EVENT_TYPES: EventType[] = ['show', 'meet', 'track_day', 'other'];

export default function EventsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [request, setRequest] = useState<OrganizationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (applied on the phone — the list of upcoming events is small)
  const [typeFilter, setTypeFilter] = useState<EventType | null>(null);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      // Load the three things at the same time instead of one after another.
      Promise.all([fetchUpcomingEvents(userId), fetchMyProfile(userId), fetchMyLatestRequest(userId)])
        .then(([eventList, myProfile, myRequest]) => {
          setEvents(eventList);
          setProfile(myProfile);
          setRequest(myRequest);
          setError(null);
        })
        .catch((e) => setError(getErrorMessage(e, t('common.error'))))
        .finally(() => setLoading(false));
    }, [userId, t]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (typeFilter && event.event_type !== typeFilter) return false;
      if (!q) return true;
      return [event.title, event.brand, event.location_name, event.address]
        .some((field) => field?.toLowerCase().includes(q));
    });
  }, [events, typeFilter, query]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAdmin = profile?.role === 'admin';

  const header = (
    <View style={styles.header}>
      {/* ---- Role-specific actions ---- */}
      {canCreateEvents(profile) ? (
        <Button title={t('events.create')} onPress={() => router.push('/events/new')} />
      ) : (
        <OrganizerBanner request={request} />
      )}
      {isAdmin && (
        <Button
          title={t('events.reviewRequests')}
          onPress={() => router.push('/admin/requests')}
          variant="secondary"
        />
      )}

      {/* ---- Filters ---- */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('events.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.chips}>
        {[null, ...EVENT_TYPES].map((type) => {
          const selected = typeFilter === type;
          return (
            <Pressable
              key={type ?? 'all'}
              onPress={() => setTypeFilter(type)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {type ? t(`eventTypes.${type}`) : t('events.all')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(event) => event.id}
      renderItem={({ item }) => <EventCard event={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text style={error ? styles.error : styles.empty}>
          {error ?? (events.length === 0 ? t('events.empty') : t('events.noMatches'))}
        </Text>
      }
      keyboardDismissMode="on-drag"
    />
  );
}

/** Shown to users who can't create events: invite to apply, or show the application status. */
function OrganizerBanner({ request }: { request: OrganizationRequest | null }) {
  const { t } = useTranslation();

  if (request?.status === 'pending') {
    return (
      <View style={styles.banner}>
        <Ionicons name="time-outline" size={20} color={colors.textMuted} />
        <Text style={styles.bannerText}>{t('events.applicationPending')}</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.banner} onPress={() => router.push('/events/apply')}>
      <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
      <View style={styles.bannerBody}>
        <Text style={styles.bannerText}>
          {request?.status === 'rejected' ? t('events.applicationRejected') : t('events.areYouOrganizer')}
        </Text>
        <Text style={styles.bannerLink}>{t('events.apply')} →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { gap: spacing.md },
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  bannerBody: { flex: 1, gap: 4 },
  bannerText: { flex: 1, fontSize: 14, color: colors.text },
  bannerLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  error: { color: colors.error, textAlign: 'center', paddingVertical: spacing.xl },
});
