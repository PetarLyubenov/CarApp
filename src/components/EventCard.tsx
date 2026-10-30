/**
 * One event in the list: cover, date badge, title, place, price and who's going.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';
import { formatDateTime, formatEuro, formatMonth } from '@/lib/format';
import type { EventItem } from '@/services/events';

export function EventCard({ event }: { event: EventItem }) {
  const { t } = useTranslation();
  const start = new Date(event.starts_at);
  const price = event.price ? formatEuro(Number(event.price)) : t('events.free');

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
    >
      {event.coverUrl && (
        <Image source={{ uri: event.coverUrl }} style={styles.cover} contentFit="cover" transition={150} />
      )}

      <View style={styles.body}>
        {/* Calendar-style date badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.month}>{formatMonth(event.starts_at)}</Text>
          <Text style={styles.day}>{start.getDate()}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.type}>
            {t(`eventTypes.${event.event_type}`)}
            {event.brand ? ` · ${event.brand}` : ''}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.meta}>{formatDateTime(event.starts_at)}</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {event.location_name}
            </Text>
          </View>
          <Text style={styles.meta}>
            {price} · {t('events.going', { count: event.goingCount })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card },
  cover: { width: '100%', aspectRatio: 2 / 1 },
  body: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  dateBadge: {
    width: 52,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: { fontSize: 11, fontWeight: '700', color: colors.primary },
  day: { fontSize: 22, fontWeight: '700', color: colors.text },
  info: { flex: 1, gap: 2 },
  type: { fontSize: 12, fontWeight: '600', color: colors.primary },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
});
