/**
 * Two flag buttons (🇧🇬 / 🇬🇧) that switch the app's language.
 * The selected flag gets a red ring; the choice is remembered for the next launch.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';
import { LANGUAGES, setLanguage, type Language } from '@/i18n';

// Flags are emoji made of two "regional indicator" letters, so no image files are needed.
const FLAGS: Record<Language, string> = {
  bg: '🇧🇬',
  en: '🇬🇧',
};

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.row}>
      {LANGUAGES.map((language) => {
        const selected = i18n.language === language;
        return (
          <Pressable
            key={language}
            onPress={() => setLanguage(language)}
            hitSlop={6}
            style={[styles.flag, selected && styles.flagSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t(`language.${language}`)}
          >
            <Text style={[styles.emoji, !selected && styles.dimmed]}>{FLAGS[language]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flag: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.card,
  },
  flagSelected: { borderColor: colors.primary },
  emoji: { fontSize: 24 },
  dimmed: { opacity: 0.5 },
});
