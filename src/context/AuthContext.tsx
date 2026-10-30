/**
 * AuthContext — keeps track of who is logged in and shares it with the whole app.
 *
 * A React "context" works like a shared service: the provider at the top of the app
 * holds the value, and any screen can read it with the `useAuth()` hook.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type AuthState = {
  /** The current login session, or null when nobody is signed in. */
  session: Session | null;
  /** True until we know whether a saved session exists (avoids flashing the login screen). */
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Load a session saved from a previous launch.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // 2. Listen for future changes: sign in, sign out, token refresh.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // Cleanup when the provider unmounts (like Dispose in C#).
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Supabase returns errors instead of throwing them. Throw it, so the screen can
    // show what went wrong instead of the button silently doing nothing.
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut }}>{children}</AuthContext.Provider>
  );
}

/** Read the auth state from any component inside <AuthProvider>. */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
