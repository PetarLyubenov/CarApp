/**
 * Admin screen: approve or reject organizer applications.
 * The database function checks that you're an admin, so this screen is safe even if
 * someone opens it without being one — they'd just see an empty list / an error.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { fetchPendingRequests, reviewRequest, type PendingRequest } from '@/services/organizations';

export default function RequestsScreen() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchPendingRequests()
      .then((result) => {
        setRequests(result);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [t]);

  useFocusEffect(load);

  const review = async (request: PendingRequest, approve: boolean) => {
    setBusyId(request.id);
    try {
      await reviewRequest(request.id, approve);
      Alert.alert(approve ? t('organizer.approved', { name: request.org_name }) : t('organizer.rejected'));
      load();
    } catch (e) {
      Alert.alert(getErrorMessage(e, t('common.error')));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={requests}
      keyExtractor={(request) => request.id}
      ListEmptyComponent={
        <Text style={error ? styles.error : styles.empty}>{error ?? t('organizer.noPending')}</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.org_name}</Text>
          <Text style={styles.muted}>
            {t('organizer.from', { username: item.applicant?.username ?? '?' })} ·{' '}
            {formatDate(item.created_at)}
          </Text>
          {item.website && (
            <Text style={styles.link} onPress={() => Linking.openURL(item.website!)}>
              {item.website}
            </Text>
          )}
          {item.message && <Text style={styles.message}>{item.message}</Text>}
          <View style={styles.buttons}>
            <View style={styles.flex}>
              <Button title={t('organizer.reject')} onPress={() => review(item, false)} variant="secondary" />
            </View>
            <View style={styles.flex}>
              <Button title={t('organizer.approve')} onPress={() => review(item, true)} loading={busyId === item.id} />
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.md, gap: spacing.xs },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  link: { fontSize: 14, color: colors.primary },
  message: { fontSize: 15, color: colors.text, marginTop: spacing.xs },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  error: { color: colors.error, textAlign: 'center', paddingVertical: spacing.xl },
});
