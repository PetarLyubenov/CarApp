/**
 * Profiles service — read, search and edit user profiles.
 */
import { supabase } from '@/lib/supabase';
import type { Profile, Visibility } from '@/types/database';

/** The few profile fields lists need (friends, search results). */
export type ProfileSummary = Pick<Profile, 'id' | 'username' | 'display_name' | 'role' | 'is_verified'>;

export const PROFILE_SUMMARY_COLUMNS = 'id, username, display_name, role, is_verified';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** The user's default visibility, used to pre-select the upload and car forms. */
export async function fetchDefaultVisibility(userId: string): Promise<Visibility> {
  const profile = await fetchProfile(userId);
  return profile?.default_visibility ?? 'public';
}

/** Only these fields can be changed from the app (see the column grants in schema.sql). */
export async function updateProfile(
  userId: string,
  changes: { display_name: string | null; bio: string | null; default_visibility: Visibility },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(changes).eq('id', userId);
  if (error) throw error;
}

/** Find people by username or display name (not including yourself). */
export async function searchProfiles(text: string, excludeUserId: string): Promise<ProfileSummary[]> {
  // Remove characters that have a special meaning inside Supabase filters.
  const clean = text.replace(/[%*,.()"'\\:]/g, '').trim();
  if (!clean) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SUMMARY_COLUMNS)
    .or(`username.ilike.*${clean}*,display_name.ilike.*${clean}*`)
    .neq('id', excludeUserId)
    .order('username')
    .limit(20);
  if (error) throw error;
  return (data ?? []) as ProfileSummary[];
}
