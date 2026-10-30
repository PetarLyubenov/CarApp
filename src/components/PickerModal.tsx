/**
 * Full-screen searchable list for picking one value (used for car make and model).
 * With `allowCustom`, the user can also use exactly what they typed when it's not in the list.
 */
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  options: string[];
  allowCustom?: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function PickerModal({ visible, title, options, allowCustom = false, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  // useMemo re-filters only when the query or options change, not on every render.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((option) => option.toLowerCase().includes(q)) : options;
  }, [query, options]);

  const trimmed = query.trim();
  const showCustom =
    allowCustom && trimmed.length > 0 && !options.some((o) => o.toLowerCase() === trimmed.toLowerCase());

  const choose = (value: string) => {
    setQuery('');
    onSelect(value);
  };

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={styles.close}>{t('picker.close')}</Text>
          </Pressable>
        </View>

        <TextInput

          keyboardAppearance="dark"
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder={t('picker.search')}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoFocus
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            showCustom ? (
              <Pressable style={styles.row} onPress={() => choose(trimmed)}>
                <Text style={[styles.rowText, styles.customText]}>
                  {t('picker.useCustom', { value: trimmed })}
                </Text>
              </Pressable>
            ) : undefined
          }
          ListEmptyComponent={
            showCustom ? undefined : <Text style={styles.empty}>{t('picker.noResults')}</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => choose(item)}>
              <Text style={styles.rowText}>{item}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  close: { fontSize: 16, color: colors.primary },
  search: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.card,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { fontSize: 16, color: colors.text },
  customText: { color: colors.primary, fontWeight: '600' },
  empty: { padding: spacing.md, color: colors.textMuted, textAlign: 'center' },
});
