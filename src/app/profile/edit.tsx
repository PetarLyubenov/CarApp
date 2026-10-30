/**
 * Edit your own profile: display name, bio and the default visibility for new posts.
 * (A static route like "edit" wins over the dynamic "[id]" one, so /profile/edit opens this.)
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { fetchProfile, updateProfile } from '@/services/profiles';
import { VisibilityToggle } from '@/components/VisibilityToggle';
import type { Visibility } from '@/types/database';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fill the form with the current values.
  useEffect(() => {
    fetchProfile(userId)
      .then((profile) => {
        setDisplayName(profile?.display_name ?? '');
        setBio(profile?.bio ?? '');
        setVisibility(profile?.default_visibility ?? 'public');
      })
      .catch((e) => setError(getErrorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));
  }, [userId, t]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(userId, {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        default_visibility: visibility,
      });
      router.back();
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
      setSaving(false);
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label={t('profile.displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          maxLength={50}
        />
        <TextField
          label={t('profile.bio')}
          value={bio}
          onChangeText={setBio}
          multiline
          autoCapitalize="sentences"
          maxLength={300}
          style={styles.multiline}
        />
        <Text style={styles.label}>{t('profile.defaultVisibility')}</Text>
        <VisibilityToggle value={visibility} onChange={setVisibility} />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title={t('profile.save')} onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: -spacing.sm },
  error: { color: colors.error },
});
