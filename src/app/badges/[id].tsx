/**
 * Someone's badges: every badge with its goal and progress, grouped by category,
 * plus the ranking of who has spotted the most rare cars.
 * `[id]` is the person whose badges are shown.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/Avatar';
import { BadgeIcon } from '@/components/BadgeIcon';
import { colors, spacing } from '@/constants/theme';
import { BADGE_CATEGORIES, BADGES, earnedBadges, isEarned, type Badge } from '@/data/badges';
import { getErrorMessage } from '@/lib/errors';
import { fetchRareLeaderboard, fetchUserStats, type LeaderboardRow, type UserStats } from '@/services/badges';

export default function BadgesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([fetchUserStats(id), fetchRareLeaderboard()])
      .then(([statsResult, leadersResult]) => {
        setStats(statsResult);
        setLeaders(leadersResult);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [id, t]);

  useFocusEffect(load);

  if (loading || !stats) {
    return (
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Text style={styles.muted}>{error ?? t('common.error')}</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.summary}>
        {t('badges.earned', { earned: earnedBadges(stats).length, total: BADGES.length })}
      </Text>

      {/* ---- Badges by category ---- */}
      {BADGE_CATEGORIES.map((category) => (
        <View key={category} style={styles.section}>
          <Text style={styles.sectionTitle}>{t(`badges.categories.${category}`)}</Text>
          {BADGES.filter((badge) => badge.category === category).map((badge) => (
            <BadgeRow key={badge.id} badge={badge} stats={stats} />
          ))}
        </View>
      ))}

      {/* ---- Rare car ranking ---- */}
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Ionicons name="diamond" size={18} color={colors.gold} />
          <Text style={styles.sectionTitle}>{t('badges.leaderboard')}</Text>
        </View>
        <Text style={styles.muted}>{t('badges.rareHint')}</Text>
        {leaders.length === 0 ? (
          <Text style={styles.muted}>{t('badges.leaderboardEmpty')}</Text>
        ) : (
          leaders.map((row, index) => (
            <Pressable
              key={row.user_id}
              style={[styles.leader, row.user_id === id && styles.leaderHighlighted]}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: row.user_id } })}
            >
              <Text style={[styles.rank, index < 3 && styles.rankTop]}>{index + 1}</Text>
              <Avatar name={row.username} size={36} />
              <Text style={styles.leaderName} numberOfLines={1}>
                {row.display_name ?? row.username}
              </Text>
              <Text style={styles.leaderCount}>{row.rare_spots}</Text>
              <Ionicons name="diamond" size={14} color={colors.gold} />
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

/** One badge: icon, name, goal and a progress bar. */
function BadgeRow({ badge, stats }: { badge: Badge; stats: UserStats }) {
  const { t } = useTranslation();
  const earned = isEarned(badge, stats);
  const current = Math.min(stats[badge.stat], badge.goal);

  return (
    <View style={styles.badge}>
      <BadgeIcon badge={badge} earned={earned} />
      <View style={styles.badgeText}>
        <Text style={[styles.badgeName, earned && styles.badgeNameEarned]}>{t(`badges.names.${badge.id}`)}</Text>
        <Text style={styles.muted}>{t(`badges.goals.${badge.stat}`, { count: badge.goal })}</Text>
        {!earned && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(current / badge.goal) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {current}/{badge.goal}
            </Text>
          </View>
        )}
      </View>
      {earned && <Ionicons name="checkmark-circle" size={22} color={colors.gold} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  summary: { fontSize: 16, fontWeight: '600', color: colors.gold, textAlign: 'center' },
  section: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.card,
  },
  badgeText: { flex: 1, gap: 2 },
  badgeName: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  badgeNameEarned: { color: colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  progressText: { fontSize: 12, color: colors.textMuted, minWidth: 40, textAlign: 'right' },
  leader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  leaderHighlighted: { borderWidth: 1, borderColor: colors.primary },
  rank: { width: 24, fontSize: 16, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  rankTop: { color: colors.gold },
  leaderName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  leaderCount: { fontSize: 16, fontWeight: '700', color: colors.text },
});
