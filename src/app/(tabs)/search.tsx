/**
 * Search tab — find spotted cars by make, model, city or year.
 *
 * Searching starts automatically 300 ms after the user stops typing ("debounce"),
 * so we don't send a request for every single letter.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { SpotGridItem } from '@/components/SpotGridItem';
import { colors, spacing } from '@/constants/theme';
import { MAKE_NAMES } from '@/data/carMakes';
import { getErrorMessage } from '@/lib/errors';
import { searchSpots, type FeedSpot } from '@/services/spots';

const COLUMNS = 3;
const GAP = 2;
const DEBOUNCE_MS = 300;

export default function SearchScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const tileSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FeedSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Counts searches, so an older, slower answer can't overwrite a newer one.
  const latestSearch = useRef(0);

  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const searchId = ++latestSearch.current;
      try {
        const found = await searchSpots(text);
        if (searchId === latestSearch.current) {
          setResults(found);
          setError(null);
        }
      } catch (e) {
        if (searchId === latestSearch.current) setError(getErrorMessage(e, t('common.error')));
      } finally {
        if (searchId === latestSearch.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    // If the user types again before 300 ms, cancel this timer.
    return () => clearTimeout(timer);
  }, [query, t]);

  const hasQuery = query.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* ---- Search box ---- */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          keyboardAppearance="dark"
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {!hasQuery ? (
        // ---- Nothing typed yet: tap a make to search for it ----
        <ScrollView contentContainerStyle={styles.makes} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{t('search.popularMakes')}</Text>
          <View style={styles.chips}>
            {MAKE_NAMES.map((make) => (
              <Pressable key={make} style={styles.chip} onPress={() => setQuery(make)}>
                <Text style={styles.chipText}>{make}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        // ---- Results grid ----
        <FlatList
          data={results}
          keyExtractor={(spot) => spot.id}
          numColumns={COLUMNS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP }}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => <SpotGridItem spot={item} size={tileSize} />}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.count}>{t('search.results', { count: results.length })}</Text>
            ) : undefined
          }
          ListEmptyComponent={
            loading ? undefined : (
              <Text style={error ? styles.error : styles.empty}>
                {error ?? t('search.noResults', { query: query.trim() })}
              </Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  makes: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.text, fontSize: 14 },
  count: { color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  error: { color: colors.error, textAlign: 'center', padding: spacing.lg },
});
