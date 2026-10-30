/**
 * Likes and comments on spots.
 * The database rules only allow this on spots you can see, and only as yourself.
 */
import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/database';

/** Like or unlike a spot. */
export async function setSpotLiked(spotId: string, userId: string, liked: boolean): Promise<void> {
  const { error } = liked
    ? // "ignore duplicates": liking twice (e.g. a fast double tap) is not an error
      await supabase
        .from('likes')
        .upsert({ spot_id: spotId, user_id: userId }, { onConflict: 'spot_id,user_id', ignoreDuplicates: true })
    : await supabase.from('likes').delete().eq('spot_id', spotId).eq('user_id', userId);
  if (error) throw error;
}

/** A comment with its author's username, ready to show. */
export type CommentItem = Comment & { username: string };

// Same JOIN idea as in spots.ts; the hint names the comments -> profiles link.
const COMMENT_COLUMNS = '*, author:profiles!comments_user_id_fkey(username)';

type CommentRow = Comment & { author: { username: string } | null };

function toCommentItem({ author, ...comment }: CommentRow): CommentItem {
  return { ...comment, username: author?.username ?? '?' };
}

/** All comments on a spot, oldest first (like a chat). */
export async function fetchComments(spotId: string): Promise<CommentItem[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('spot_id', spotId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as CommentRow[]).map(toCommentItem);
}

/** Post a comment and get it back, so the screen can show it right away. */
export async function addComment(spotId: string, userId: string, body: string): Promise<CommentItem> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ spot_id: spotId, user_id: userId, body: body.trim() })
    .select(COMMENT_COLUMNS)
    .single();
  if (error) throw error;
  return toCommentItem(data as CommentRow);
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}
