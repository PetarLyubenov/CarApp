/**
 * One spotted car in the feed: photos, likes and comments, car name, author, place and date.
 */
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/Avatar';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { setSpotLiked } from '@/services/social';
import type { FeedSpot } from '@/services/spots';

type Props = {
  spot: FeedSpot;
  /** What the comment button does. By default it opens the spot screen with the comments. */
  onCommentPress?: () => void;
};

export function SpotCard({ spot, onCommentPress }: Props) {
  const { t } = useTranslation();
  const { session } = useAuth();

  // Local copy of the like state, so the heart reacts instantly when tapped.
  const [liked, setLiked] = useState(spot.likedByMe);
  const [likeCount, setLikeCount] = useState(spot.likeCount);
  // When the feed reloads with fresh data, take the new values.
  useEffect(() => {
    setLiked(spot.likedByMe);
    setLikeCount(spot.likeCount);
  }, [spot.likedByMe, spot.likeCount]);

  // "Optimistic update": change the screen first, save in the background,
  // and undo the change if saving fails.
  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((count) => count + (next ? 1 : -1));
    try {
      await setSpotLiked(spot.id, session?.user.id ?? '', next);
    } catch (e) {
      setLiked(!next);
      setLikeCount((count) => count + (next ? -1 : 1));
      Alert.alert(getErrorMessage(e, t('common.error')));
    }
  };

  const openComments =
    onCommentPress ?? (() => router.push({ pathname: '/spot/[id]', params: { id: spot.id } }));

  const carName = [spot.year, spot.make, spot.model].filter(Boolean).join(' ');
  const date = formatDate(spot.created_at);

  return (
    <View style={styles.card}>
      {/* Tapping the author opens their profile */}
      <Pressable
        style={styles.header}
        onPress={() => router.push({ pathname: '/profile/[id]', params: { id: spot.user_id } })}
      >
        <Avatar name={spot.username} size={28} />
        <Text style={styles.username}>{spot.username}</Text>
        {spot.visibility === 'friends' && (
          <View style={styles.badge}>
            <Ionicons name="people" size={12} color={colors.textMuted} />
            <Text style={styles.badgeText}>{t('feed.friendsOnly')}</Text>
          </View>
        )}
      </Pressable>

      <PhotoCarousel urls={spot.imageUrls} />

      {/* ---- Like / comment buttons ---- */}
      <View style={styles.actions}>
        <Pressable
          style={styles.action}
          onPress={toggleLike}
          hitSlop={8}
          accessibilityLabel={liked ? t('spot.unlike') : t('spot.like')}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={26}
            color={liked ? colors.primary : colors.text}
          />
          {likeCount > 0 && <Text style={styles.actionCount}>{likeCount}</Text>}
        </Pressable>
        <Pressable style={styles.action} onPress={openComments} hitSlop={8} accessibilityLabel={t('spot.comments')}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          {spot.commentCount > 0 && <Text style={styles.actionCount}>{spot.commentCount}</Text>}
        </Pressable>
      </View>

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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: spacing.xs },
  carName: { fontSize: 17, fontWeight: '700', color: colors.text },
  description: { fontSize: 15, color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
