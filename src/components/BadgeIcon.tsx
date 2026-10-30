/**
 * Round badge icon: gold when earned, dim with a lock when not yet.
 */
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';
import type { Badge } from '@/data/badges';

export function BadgeIcon({ badge, earned, size = 48 }: { badge: Badge; earned: boolean; size?: number }) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        earned ? styles.earned : styles.locked,
      ]}
    >
      <Ionicons name={badge.icon} size={size * 0.5} color={earned ? colors.background : colors.textMuted} />
      {!earned && (
        <View style={styles.lock}>
          <Ionicons name="lock-closed" size={10} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  earned: { backgroundColor: colors.gold },
  locked: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    padding: 3,
    borderRadius: 9,
    backgroundColor: colors.background,
  },
});
