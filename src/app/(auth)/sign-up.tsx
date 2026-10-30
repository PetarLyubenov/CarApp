/**
 * Sign-up screen. The username is sent as "user metadata"; a database trigger
 * (see supabase/schema.sql -> handle_new_user) copies it into the `profiles` table.
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

// Same rule as the database check: 3-30 letters, numbers or underscores.
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

export default function SignUpScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    setInfo(null);

    // Validate on the phone first, so we don't send obviously bad data to the server.
    if (!username.trim() || !email.trim() || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (!USERNAME_PATTERN.test(username.trim())) {
      setError(t('auth.usernameInvalid'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is on in Supabase, there is no session yet —
    // the user must click the link in the email first.
    if (!data.session) {
      setInfo(t('auth.checkEmail'));
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
        <Text style={styles.title}>{t('auth.signUpTitle')}</Text>

        <TextField label={t('auth.username')} value={username} onChangeText={setUsername} />
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
          autoComplete="new-password"
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <Button title={t('auth.signUp')} onPress={handleSignUp} loading={loading} />

        <Link href="/sign-in" style={styles.link}>
          {t('auth.haveAccount')}
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
  info: { color: colors.success },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.sm },
});
