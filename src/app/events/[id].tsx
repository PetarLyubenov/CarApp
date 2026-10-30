/**
 * Event details: when, where, price, tickets, organizer and "Going / Interested".
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime, formatEuro } from '@/lib/format';
import { deleteEvent, fetchEvent, setAttendance, type EventItem } from '@/services/events';
import { fetchProfile } from '@/services/profiles';
import type { AttendanceStatus } from '@/types/database';

/** Open the place in Apple Maps (iPhone) or Google Maps (Android). */
function openInMaps(query: string) {
  const encoded = encodeURIComponent(query);
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encoded}`
      : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  Linking.openURL(url);
}

export default function EventScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchEvent(id, userId), fetchProfile(userId)])
        .then(([result, profile]) => {
          setEvent(result);
          setIsAdmin(profile?.role === 'admin');
        })
        .catch((e) => setError(getErrorMessage(e, t('common.error'))))
        .finally(() => setLoading(false));
    }, [id, userId, t]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error ?? t('events.notFound')}</Text>
      </View>
    );
  }

  const canDelete = event.created_by === userId || isAdmin;
  const place = [event.location_name, event.address].filter(Boolean).join(', ');
  const when = event.ends_at
    ? `${formatDateTime(event.starts_at)}\n→ ${formatDateTime(event.ends_at)}`
    : formatDateTime(event.starts_at);
  const organizerName = event.organizer?.display_name ?? event.organizer?.username ?? '?';

  // Tapping your current answer again removes it.
  const toggleAttendance = async (status: AttendanceStatus) => {
    const next = event.myStatus === status ? null : status;
    setSaving(true);
    try {
      await setAttendance(event.id, userId, next);
      setEvent(await fetchEvent(event.id, userId)); // refresh the counts
    } catch (e) {
      Alert.alert(getErrorMessage(e, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(t('events.deleteEvent'), t('events.deleteEventConfirm'), [
      { text: t('garage.cancel'), style: 'cancel' },
      {
        text: t('garage.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(event);
            router.back();
          } catch (e) {
            Alert.alert(getErrorMessage(e, t('common.error')));
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: t(`eventTypes.${event.event_type}`) }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {event.coverUrl && <Image source={{ uri: event.coverUrl }} style={styles.cover} contentFit="cover" />}

        <View style={styles.body}>
          {/* ---- Title ---- */}
          <View>
            <Text style={styles.type}>
              {t(`eventTypes.${event.event_type}`)} · {event.brand ?? t('events.allBrands')}
            </Text>
            <Text style={styles.title}>{event.title}</Text>
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: event.created_by } })}
            >
              <Text style={styles.link}>{t('events.organizedBy', { name: organizerName })}</Text>
              {event.organizer?.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} accessibilityLabel={t('events.verified')} />
              )}
            </Pressable>
          </View>

          {/* ---- Going / Interested ---- */}
          <View style={styles.attendance}>
            {(['going', 'interested'] as const).map((status) => {
              const selected = event.myStatus === status;
              const count = status === 'going' ? event.goingCount : event.interestedCount;
              return (
                <Pressable
                  key={status}
                  disabled={saving}
                  onPress={() => toggleAttendance(status)}
                  style={[styles.attendButton, selected && styles.attendSelected]}
                >
                  <Ionicons
                    name={status === 'going' ? 'checkmark-circle-outline' : 'star-outline'}
                    size={18}
                    color={selected ? '#fff' : colors.primary}
                  />
                  <Text style={[styles.attendText, selected && styles.attendTextSelected]}>
                    {t(`events.${status}`)} · {count}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ---- Details ---- */}
          <View style={styles.card}>
            <DetailRow icon="calendar-outline" label={t('events.when')} value={when} />
            <DetailRow icon="location-outline" label={t('events.where')} value={place} />
            <DetailRow
              icon="pricetag-outline"
              label={t('events.price')}
              value={event.price ? formatEuro(Number(event.price)) : t('events.free')}
            />
          </View>

          <View style={styles.buttons}>
            <Button title={t('events.openInMaps')} onPress={() => openInMaps(place)} variant="secondary" />
            {event.ticket_url && (
              <Button title={t('events.buyTickets')} onPress={() => Linking.openURL(event.ticket_url!)} />
            )}
          </View>

          {event.description && <Text style={styles.description}>{event.description}</Text>}

          {canDelete && (
            <Button title={t('events.deleteEvent')} onPress={confirmDelete} variant="secondary" />
          )}
        </View>
      </ScrollView>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
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
  cover: { width: '100%', aspectRatio: 2 / 1, backgroundColor: colors.card },
  body: { padding: spacing.md, gap: spacing.md },
  type: { fontSize: 13, fontWeight: '600', color: colors.primary },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  muted: { fontSize: 14, color: colors.textMuted },
  link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  attendance: { flexDirection: 'row', gap: spacing.sm },
  attendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  attendSelected: { backgroundColor: colors.primary },
  attendText: { fontWeight: '600', color: colors.primary },
  attendTextSelected: { color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.md, gap: spacing.md },
  detailRow: { flexDirection: 'row', gap: spacing.md },
  detailText: { flex: 1, gap: 2 },
  detailLabel: { fontSize: 13, color: colors.textMuted },
  detailValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  buttons: { gap: spacing.sm },
  description: { fontSize: 15, color: colors.text, lineHeight: 22 },
});
