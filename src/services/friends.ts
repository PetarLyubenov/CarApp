/**
 * Friends service — requests, accepting, removing and listing friends.
 *
 * One row in `friendships` per pair of people:
 *   requester_id -> who sent the request, addressee_id -> who received it,
 *   status 'pending' until the addressee accepts, then 'accepted'.
 * The database rules only let you see and change rows you are part of.
 */
import { supabase } from '@/lib/supabase';
import { PROFILE_SUMMARY_COLUMNS, type ProfileSummary } from '@/services/profiles';
import type { Friendship } from '@/types/database';

/** How the current user relates to another user. */
export type FriendStatus =
  | 'self' // it's your own profile
  | 'none' // not friends, no request
  | 'outgoing' // you sent a request, waiting for them
  | 'incoming' // they sent you a request, waiting for you
  | 'friends';

/** Filter that matches the row between two people, whichever direction it was sent. */
function pairFilter(a: string, b: string): string {
  return `and(requester_id.eq.${a},addressee_id.eq.${b}),and(requester_id.eq.${b},addressee_id.eq.${a})`;
}

export async function fetchFriendStatus(me: string, them: string): Promise<FriendStatus> {
  if (me === them) return 'self';
  const { data, error } = await supabase.from('friendships').select('*').or(pairFilter(me, them)).maybeSingle();
  if (error) throw error;

  const row = data as Friendship | null;
  if (!row) return 'none';
  if (row.status === 'accepted') return 'friends';
  return row.requester_id === me ? 'outgoing' : 'incoming';
}

export async function sendFriendRequest(me: string, them: string): Promise<void> {
  const { error } = await supabase.from('friendships').insert({ requester_id: me, addressee_id: them });
  if (error) throw error;
}

/** Accept a request that `them` sent to `me`. */
export async function acceptFriendRequest(me: string, them: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', them)
    .eq('addressee_id', me);
  if (error) throw error;
}

/** Unfriend, cancel your request, or decline theirs — all remove the row. */
export async function removeFriendship(me: string, them: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().or(pairFilter(me, them));
  if (error) throw error;
}

type FriendshipWithProfiles = Friendship & {
  requester: ProfileSummary;
  addressee: ProfileSummary;
};

/** All of your friendship rows with both people's profiles attached. */
async function fetchMyFriendships(me: string): Promise<FriendshipWithProfiles[]> {
  // friendships links to profiles twice (requester and addressee), so each link is named.
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `*, requester:profiles!friendships_requester_id_fkey(${PROFILE_SUMMARY_COLUMNS}), addressee:profiles!friendships_addressee_id_fkey(${PROFILE_SUMMARY_COLUMNS})`,
    )
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FriendshipWithProfiles[];
}

export type FriendLists = {
  friends: ProfileSummary[];
  /** Requests others sent you, waiting for your answer. */
  incoming: ProfileSummary[];
  /** Requests you sent, waiting for their answer. */
  outgoing: ProfileSummary[];
};

/** Friends and open requests in one request. */
export async function fetchFriendLists(me: string): Promise<FriendLists> {
  const rows = await fetchMyFriendships(me);
  // "The other person" in each row.
  const other = (row: FriendshipWithProfiles) => (row.requester_id === me ? row.addressee : row.requester);

  return {
    friends: rows
      .filter((r) => r.status === 'accepted')
      .map(other)
      .sort((a, b) => a.username.localeCompare(b.username)),
    incoming: rows.filter((r) => r.status === 'pending' && r.addressee_id === me).map(other),
    outgoing: rows.filter((r) => r.status === 'pending' && r.requester_id === me).map(other),
  };
}

/** Ids of your friends — used by the "Friends" feed filter. */
export async function fetchFriendIds(me: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
  if (error) throw error;
  return (data ?? []).map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id) as string);
}
