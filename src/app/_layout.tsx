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
import { useTranslation } from 'react-i18next';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';

/** Header settings shared by screens that open on top of the tabs. */
const pushedScreen = {
  headerShown: true,
  headerBackButtonDisplayMode: 'minimal',
  headerTintColor: colors.primary,
} as const;

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
  const { t } = useTranslation();

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
        {/* These open on top of the tabs, with a back button */}
        <Stack.Screen name="spot/[id]" options={{ ...pushedScreen, title: '' }} />
        <Stack.Screen name="garage/new" options={{ ...pushedScreen, title: t('garage.newCar') }} />
        <Stack.Screen name="garage/[id]/index" options={{ ...pushedScreen, title: '' }} />
        <Stack.Screen name="events/[id]" options={{ ...pushedScreen, title: '' }} />
        <Stack.Screen name="events/new" options={{ ...pushedScreen, title: t('events.newEvent') }} />
        <Stack.Screen name="events/apply" options={{ ...pushedScreen, title: t('organizer.applyTitle') }} />
        <Stack.Screen name="admin/requests" options={{ ...pushedScreen, title: t('organizer.reviewTitle') }} />
        {/* A sheet that slides up over the car screen */}
        <Stack.Screen
          name="garage/[id]/add-mod"
          options={{ ...pushedScreen, title: t('garage.newMod'), presentation: 'modal' }}
        />
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
