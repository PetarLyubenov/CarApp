/**
 * Text input with a label above it. Accepts every normal TextInput prop
 * (secureTextEntry, keyboardType, ...) and passes them through.
 */
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, spacing } from '@/constants/theme';

type Props = TextInputProps & { label: string };

export function TextField({ label, style, ...inputProps }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance="dark"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
});
