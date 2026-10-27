/**
 * One spotted car in the feed: photos, car name, author, place and date.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { PhotoCarousel } from '@/components/PhotoCarousel';
import { colors, spacing } from '@/constants/theme';
import type { FeedSpot } from '@/services/spots';

export function SpotCard({ spot }: { spot: FeedSpot }) {
  const { t } = useTranslation();
  const carName = [spot.year, spot.make, spot.model].filter(Boolean).join(' ');
  const date = new Date(spot.created_at).toLocaleDateString();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={28} color={colors.textMuted} />
        <Text style={styles.username}>{spot.username}</Text>
        {spot.visibility === 'friends' && (
          <View style={styles.badge}>
            <Ionicons name="people" size={12} color={colors.textMuted} />
            <Text style={styles.badgeText}>{t('feed.friendsOnly')}</Text>
          </View>
        )}
      </View>

      <PhotoCarousel urls={spot.imageUrls} />

      <View style={styles.body}>
        <Text style={styles.carName}>{carName}</Text>
        {spot.description && <Text style={styles.description}>{spot.description}</Text>}
        <Text style={styles.meta}>{[spot.city, date].filter(Boolean).join(' · ')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  username: { fontWeight: '600', color: colors.text, flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, color: colors.textMuted },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  carName: { fontSize: 17, fontWeight: '700', color: colors.text },
  description: { fontSize: 15, color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
