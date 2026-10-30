/**
 * One person in a list (friends, requests, search results). Opens their profile when tapped.
 * `right` is an optional area for buttons, e.g. Accept / Decline.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/Avatar';
import { colors, spacing } from '@/constants/theme';
import type { ProfileSummary } from '@/services/profiles';

export function PersonRow({ person, right }: { person: ProfileSummary; right?: ReactNode }) {
  const verified = person.role === 'admin' || (person.role === 'organization' && person.is_verified);

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: person.id } })}
    >
      <Avatar name={person.username} size={44} />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {person.display_name ?? person.username}
          </Text>
          {verified && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
        </View>
        <Text style={styles.username}>@{person.username}</Text>
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  text: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  username: { fontSize: 13, color: colors.textMuted },
});
