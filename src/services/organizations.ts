/**
 * Profiles and organizer applications: who may create events, and how to become an organizer.
 */
import { supabase } from '@/lib/supabase';
import type { OrganizationRequest, Profile } from '@/types/database';

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** Same rule as can_create_events() in the database. */
export function canCreateEvents(profile: Profile | null): boolean {
  return profile?.role === 'admin' || (profile?.role === 'organization' && profile.is_verified);
}

/** The user's most recent organizer application, if any. */
export async function fetchMyLatestRequest(userId: string): Promise<OrganizationRequest | null> {
  const { data, error } = await supabase
    .from('organization_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as OrganizationRequest | null;
}

export async function applyAsOrganization(input: {
  userId: string;
  orgName: string;
  website: string | null;
  message: string | null;
}): Promise<void> {
  const { error } = await supabase.from('organization_requests').insert({
    user_id: input.userId,
    org_name: input.orgName,
    website: input.website,
    message: input.message,
  });
  if (error) throw error;
}

export type PendingRequest = OrganizationRequest & { applicant: { username: string } | null };

/** Admins only: applications waiting for review, oldest first. */
export async function fetchPendingRequests(): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from('organization_requests')
    .select('*, applicant:profiles!organization_requests_user_id_fkey(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PendingRequest[];
}

/** Admins only: approve (makes the user a verified organization) or reject. */
export async function reviewRequest(requestId: string, approve: boolean): Promise<void> {
  // .rpc() calls a database function — here review_organization_request in events.sql.
  const { error } = await supabase.rpc('review_organization_request', {
    request_id: requestId,
    approve,
  });
  if (error) throw error;
}
