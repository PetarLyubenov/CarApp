/**
 * Supabase client — the single connection point between the app and the backend.
 *
 * Every screen that needs data imports `supabase` from here, so the connection
 * is created only once (similar to a singleton service in C#).
 */

// Adds a `localStorage` global backed by SQLite, so the login session survives app restarts.
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Values come from the `.env.local` file (see `.env.example`).
// Only variables prefixed with EXPO_PUBLIC_ are visible inside the app.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env.local, fill in your project URL ' +
      'and publishable key, then restart with `npx expo start --clear`.',
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Mobile apps have no browser URL to read a session from.
    detectSessionInUrl: false,
  },
});

// Refresh the login token only while the app is open (saves battery and network).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
