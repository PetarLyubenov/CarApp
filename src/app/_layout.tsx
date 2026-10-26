/**
 * Root layout — the first thing the app renders.
 *
 * Expo Router turns every file in `src/app/` into a screen. Folders in brackets,
 * like `(auth)` and `(tabs)`, are "groups": they organize screens without adding to the URL.
 *
 * Here we decide which group the user may see:
 *   - signed in  -> (tabs): the main app
 *   - signed out -> (auth): sign in / sign up
 */
import '@/i18n'; // initialize translations before any screen renders
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  // While checking for a saved session, show a spinner instead of the login screen.
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isSignedIn = session !== null;

  // Stack.Protected hides a group when its guard is false and redirects automatically,
  // so after signing in/out the user lands on the correct screens without extra code.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
