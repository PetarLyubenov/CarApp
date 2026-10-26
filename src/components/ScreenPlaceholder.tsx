/**
 * Temporary content for screens we haven't built yet.
 * Replace it screen by screen as features are implemented.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  /** Optional extra content under the text, e.g. a button. */
  children?: ReactNode;
};

export function ScreenPlaceholder({ icon, description, children }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.primary} />
      <Text style={styles.title}>{t('common.comingSoon')}</Text>
      <Text style={styles.description}>{description}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  description: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
});
