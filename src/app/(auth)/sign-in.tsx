/**
 * Sign-in screen. On success the AuthContext receives the new session and the
 * root layout automatically switches to the tabs — no manual navigation needed.
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // useState = a variable that re-renders the screen when it changes.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Language flags in the top-right corner, below the status bar */}
      <View style={[styles.language, { top: insets.top + spacing.sm }]}>
        <LanguageSwitcher />
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>{t('auth.signInTitle')}</Text>

        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title={t('auth.signIn')} onPress={handleSignIn} loading={loading} />

        <Link href="/sign-up" style={styles.link}>
          {t('auth.noAccount')}
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  language: { position: 'absolute', right: spacing.lg, zIndex: 1 },
  form: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  error: { color: colors.error },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.sm },
});
