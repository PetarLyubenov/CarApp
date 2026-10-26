/**
 * Reusable button. Shows a spinner while `loading` is true and blocks double taps.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function Button({ title, onPress, loading = false, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        (pressed || loading) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: 'transparent' },
  dimmed: { opacity: 0.7 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryText: { color: colors.primary },
});
