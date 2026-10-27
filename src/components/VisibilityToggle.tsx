/**
 * Two-way switch: "Everyone" / "Friends only". Used by the spot and car forms.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';
import type { Visibility } from '@/types/database';

type Props = { value: Visibility; onChange: (value: Visibility) => void };

export function VisibilityToggle({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('upload.visibility')}</Text>
      <View style={styles.segment}>
        {(['public', 'friends'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.item, value === option && styles.itemActive]}
          >
            <Text style={[styles.text, value === option && styles.textActive]}>
              {t(option === 'public' ? 'upload.public' : 'upload.friends')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4 },
  item: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  itemActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  text: { color: colors.textMuted, fontWeight: '500' },
  textActive: { color: colors.text, fontWeight: '600' },
});
