/**
 * Friends screen: find people, answer friend requests, see your friends.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { PersonRow } from '@/components/PersonRow';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import {
  acceptFriendRequest,
  fetchFriendLists,
  removeFriendship,
  type FriendLists,
} from '@/services/friends';
import { searchProfiles, type ProfileSummary } from '@/services/profiles';

const DEBOUNCE_MS = 300;

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const me = session?.user.id ?? '';

  const [lists, setLists] = useState<FriendLists>({ friends: [], incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const latestSearch = useRef(0);

  const load = useCallback(() => {
    fetchFriendLists(me)
      .then((result) => {
        setLists(result);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [me, t]);

  // Reload when coming back from someone's profile (you may have added them there).
  useFocusEffect(load);

  // Search people 300 ms after the user stops typing (same idea as the car search).
  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const searchId = ++latestSearch.current;
      try {
        const found = await searchProfiles(text, me);
        if (searchId === latestSearch.current) setResults(found);
      } catch (e) {
        if (searchId === latestSearch.current) setError(getErrorMessage(e, t('common.error')));
      } finally {
        if (searchId === latestSearch.current) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, me, t]);

  const answer = async (person: ProfileSummary, accept: boolean) => {
    try {
      if (accept) await acceptFriendRequest(me, person.id);
      else await removeFriendship(me, person.id);
      load();
    } catch (e) {
      Alert.alert(getErrorMessage(e, t('common.error')));
    }
  };

  const hasQuery = query.trim().length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* ---- Find people ---- */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('friends.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {hasQuery ? (
        // ---- Search results ----
        results.length > 0 ? (
          results.map((person) => <PersonRow key={person.id} person={person} />)
        ) : (
          !searching && <Text style={styles.muted}>{t('friends.noResults', { query: query.trim() })}</Text>
        )
      ) : loading ? (
        <ActivityIndicator style={styles.spinner} color={colors.primary} />
      ) : (
        <>
          {error && <Text style={styles.error}>{error}</Text>}

          {/* ---- Requests waiting for you ---- */}
          {lists.incoming.length > 0 && (
            <Section title={t('friends.requests')}>
              {lists.incoming.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  right={
                    <View style={styles.answerButtons}>
                      <IconButton icon="close" onPress={() => answer(person, false)} />
                      <IconButton icon="checkmark" onPress={() => answer(person, true)} primary />
                    </View>
                  }
                />
              ))}
            </Section>
          )}

          {/* ---- Your friends ---- */}
          <Section title={`${t('friends.yourFriends')} · ${lists.friends.length}`}>
            {lists.friends.length === 0 ? (
              <Text style={styles.muted}>{t('friends.noFriends')}</Text>
            ) : (
              lists.friends.map((person) => <PersonRow key={person.id} person={person} />)
            )}
          </Section>

          {/* ---- Requests you sent ---- */}
          {lists.outgoing.length > 0 && (
            <Section title={t('friends.sent')}>
              {lists.outgoing.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </Section>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** Small round button for accept (✓) / decline (✕). */
function IconButton({
  icon,
  onPress,
  primary = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={[styles.iconButton, primary && styles.iconButtonPrimary]}>
      <Ionicons name={icon} size={20} color={primary ? '#fff' : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  spinner: { marginTop: spacing.xl },
  section: { gap: spacing.xs },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  muted: { fontSize: 14, color: colors.textMuted },
  error: { color: colors.error },
  answerButtons: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  iconButtonPrimary: { backgroundColor: colors.primary },
});
