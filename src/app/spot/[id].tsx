/**
 * Spot details — the spot itself plus its comments, with a comment box at the bottom.
 * Opened from search, profiles and the comment button in the feed.
 * `[id]` in the file name makes it a dynamic route: /spot/<spot id>.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/Avatar';
import { SpotCard } from '@/components/SpotCard';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { addComment, deleteComment, fetchComments, type CommentItem } from '@/services/social';
import { fetchSpot, type FeedSpot } from '@/services/spots';

/** Height of the iOS navigation bar under the status bar. */
const IOS_HEADER_HEIGHT = 44;

export default function SpotScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const me = session?.user.id ?? '';
  const insets = useSafeAreaInsets();

  const [spot, setSpot] = useState<FeedSpot | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    Promise.all([fetchSpot(id), fetchComments(id)])
      .then(([spotResult, commentsResult]) => {
        setSpot(spotResult);
        setComments(commentsResult);
      })
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [id, t]);

  // Keep the comment count on the card in sync with the list below it.
  const changeCommentCount = (delta: number) =>
    setSpot((current) => (current ? { ...current, commentCount: current.commentCount + delta } : current));

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const comment = await addComment(id, me, text);
      setComments((current) => [...current, comment]);
      changeCommentCount(1);
      setText('');
      // Show the new comment at the bottom.
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert(getErrorMessage(e, t('common.error')));
    } finally {
      setSending(false);
    }
  };

  // Long-press your own comment to delete it.
  const confirmDelete = (comment: CommentItem) => {
    Alert.alert(t('spot.deleteComment'), t('spot.deleteCommentConfirm'), [
      { text: t('spot.cancel'), style: 'cancel' },
      {
        text: t('spot.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(comment.id);
            setComments((current) => current.filter((c) => c.id !== comment.id));
            changeCommentCount(-1);
          } catch (e) {
            Alert.alert(getErrorMessage(e, t('common.error')));
          }
        },
      },
    ]);
  };

  // The header title becomes the car name once it's loaded.
  const title = spot ? `${spot.make} ${spot.model}` : '';

  if (loading || !spot) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={styles.message}>{error ?? t('spot.notFound')}</Text>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      {/* Pushes the comment box up above the keyboard. On iOS it needs to know how
          much space the header takes, because the header is not part of this view. */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + IOS_HEADER_HEIGHT : 0}
      >
        <ScrollView ref={scrollRef} style={styles.flex} keyboardShouldPersistTaps="handled">
          <SpotCard spot={spot} onCommentPress={() => inputRef.current?.focus()} />

          {/* ---- Comments ---- */}
          <View style={styles.comments}>
            <Text style={styles.sectionTitle}>{t('spot.comments')}</Text>
            {comments.length === 0 && <Text style={styles.message}>{t('spot.noComments')}</Text>}
            {comments.map((comment) => (
              <Pressable
                key={comment.id}
                style={styles.comment}
                onLongPress={comment.user_id === me ? () => confirmDelete(comment) : undefined}
              >
                <Pressable onPress={() => router.push({ pathname: '/profile/[id]', params: { id: comment.user_id } })}>
                  <Avatar name={comment.username} size={32} />
                </Pressable>
                <View style={styles.flex}>
                  <Text style={styles.commentText}>
                    <Text style={styles.commentAuthor}>{comment.username} </Text>
                    {comment.body}
                  </Text>
                  <Text style={styles.commentDate}>{formatDateTime(comment.created_at)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* ---- New comment ---- */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t('spot.commentPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            hitSlop={8}
            accessibilityLabel={t('spot.send')}
          >
            {sending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="send" size={24} color={text.trim() ? colors.primary : colors.textMuted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  message: { color: colors.textMuted, textAlign: 'center' },
  comments: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  comment: { flexDirection: 'row', gap: spacing.sm },
  commentText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  commentAuthor: { fontWeight: '700' },
  commentDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    fontSize: 15,
    color: colors.text,
  },
});
