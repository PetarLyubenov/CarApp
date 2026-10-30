/**
 * Badges service — a person's numbers and the rare-car ranking.
 * The counting happens in the database (see supabase/badges.sql).
 */
import { supabase } from '@/lib/supabase';

/** The numbers badges are based on. Names match the columns returned by user_stats(). */
export type UserStats = {
  spots: number;
  rare_spots: number;
  makes: number;
  likes_received: number;
  friends: number;
  cars: number;
  mods: number;
};

export type LeaderboardRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  rare_spots: number;
};

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase.rpc('user_stats', { target: userId }).single();
  if (error) throw error;
  return data as UserStats;
}

/** People with the most rare cars spotted, best first. */
export async function fetchRareLeaderboard(maxRows = 10): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('rare_leaderboard', { max_rows: maxRows });
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}
