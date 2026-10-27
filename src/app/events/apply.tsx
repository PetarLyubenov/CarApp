/**
 * Apply to become a verified organizer (who can post events).
 * An admin reviews the application in /admin/requests.
 */
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { normalizeUrl } from '@/lib/format';
import { applyAsOrganization } from '@/services/organizations';

export default function ApplyScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    if (orgName.trim().length < 2) return setError(t('organizer.needName'));

    let url: string | null = null;
    if (website.trim()) {
      url = normalizeUrl(website);
      if (!url) return setError(t('events.invalidUrl'));
    }

    setError(null);
    setSending(true);
    try {
      await applyAsOrganization({
        userId,
        orgName: orgName.trim(),
        website: url,
        message: message.trim() || null,
      });
      Alert.alert(t('organizer.sent'));
      router.back();
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>{t('organizer.applyIntro')}</Text>
        <TextField label={t('organizer.orgName')} value={orgName} onChangeText={setOrgName} autoCapitalize="words" />
        <TextField
          label={t('organizer.website')}
          placeholder="https://"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
        />
        <TextField
          label={t('organizer.message')}
          value={message}
          onChangeText={setMessage}
          multiline
          autoCapitalize="sentences"
          style={styles.multiline}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title={t('organizer.submit')} onPress={handleSubmit} loading={sending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  intro: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.error },
});
