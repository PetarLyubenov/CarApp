/**
 * Spots service — all database and storage work for spotted-car photos.
 *
 * Screens call these functions instead of talking to Supabase directly
 * (like a repository/service class in C#), so the screens stay focused on the UI.
 */
import { supabase } from '@/lib/supabase';
import {
  orderedPaths,
  removePhotos,
  signPhotoUrls,
  uploadPhotos,
  type LocalPhoto,
} from '@/services/photos';
import type { Spot, Visibility } from '@/types/database';

const BUCKET = 'spots';

export type NewSpot = {
  userId: string;
  /** In display order — the first photo becomes the cover. */
  photos: LocalPhoto[];
  make: string;
  model: string;
  year: number | null;
  city: string | null;
  description: string | null;
  visibility: Visibility;
};

/** A spot ready to show in the feed: includes the author's username and photo links. */
export type FeedSpot = Spot & {
  username: string;
  /** Signed links to all photos, cover first. */
  imageUrls: string[];
};

/**
 * Upload all photos, then save the spot and its photo list.
 * If anything fails half-way, everything already uploaded is removed again,
 * so we never leave a spot without photos or photos without a spot.
 */
export async function uploadSpot(spot: NewSpot): Promise<void> {
  if (spot.photos.length === 0) throw new Error('A spot needs at least one photo.');

  const uploadedPaths = await uploadPhotos(BUCKET, spot.userId, spot.photos);
  let spotId: string | null = null;

  try {
    // `.select('id').single()` makes the insert return the new row's id.
    const { data, error: spotError } = await supabase
      .from('spots')
      .insert({
        user_id: spot.userId,
        image_path: uploadedPaths[0], // cover photo
        make: spot.make,
        model: spot.model,
        year: spot.year,
        city: spot.city,
        description: spot.description,
        visibility: spot.visibility,
      })
      .select('id')
      .single();
    if (spotError) throw spotError;
    spotId = data.id as string;

    const { error: photosError } = await supabase.from('spot_photos').insert(
      uploadedPaths.map((path, index) => ({ spot_id: spotId, image_path: path, position: index })),
    );
    if (photosError) throw photosError;
  } catch (e) {
    // Undo: deleting the spot also deletes its photo rows (on delete cascade).
    if (spotId) await supabase.from('spots').delete().eq('id', spotId);
    await removePhotos(BUCKET, uploadedPaths);
    throw e;
  }
}

// Columns loaded for every spot.
// `author:profiles!spots_user_id_fkey(username)` is like a JOIN in SQL.
// The `!spots_user_id_fkey` part names WHICH link to follow: spots and profiles are
// also connected through the `likes` table, and without it Supabase can't choose.
// `photos:spot_photos(image_path, position)` brings each spot's photo list along.
const SPOT_COLUMNS =
  '*, author:profiles!spots_user_id_fkey(username), photos:spot_photos(image_path, position)';

type SpotRow = Spot & {
  author: { username: string } | null;
  photos: { image_path: string; position: number }[];
};

/**
 * Turn database rows into FeedSpots: add the username and signed photo links.
 * With `coverOnly`, only the first photo is signed (enough for a thumbnail grid).
 */
async function toFeedSpots(rows: SpotRow[], { coverOnly = false } = {}): Promise<FeedSpot[]> {
  if (rows.length === 0) return [];

  // Photo paths per spot, in order. Spots without photo rows fall back to the cover.
  const pathsBySpot = new Map(
    rows.map((row) => {
      const paths = orderedPaths(row.photos, row.image_path);
      return [row.id, coverOnly ? paths.slice(0, 1) : paths];
    }),
  );
  const urlByPath = await signPhotoUrls(BUCKET, [...pathsBySpot.values()].flat());

  return rows.map(({ author, photos: _photos, ...spot }) => ({
    ...spot,
    username: author?.username ?? '?',
    imageUrls: (pathsBySpot.get(spot.id) ?? [])
      .map((path) => urlByPath.get(path))
      .filter((url): url is string => Boolean(url)),
  }));
}

/**
 * Newest spots the current user is allowed to see.
 * The database security rules already filter out other people's "friends only" spots.
 * Pass `onlyUserIds` to show just those people's spots (the "Friends" feed).
 */
export async function fetchFeed({
  onlyUserIds,
  limit = 50,
}: { onlyUserIds?: string[]; limit?: number } = {}): Promise<FeedSpot[]> {
  let query = supabase.from('spots').select(SPOT_COLUMNS);
  if (onlyUserIds) query = query.in('user_id', onlyUserIds);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return toFeedSpots((data ?? []) as SpotRow[]);
}

/** One person's spots for their profile grid (only the ones you're allowed to see). */
export async function fetchUserSpots(userId: string, limit = 60): Promise<FeedSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return toFeedSpots((data ?? []) as SpotRow[], { coverOnly: true });
}

/**
 * Split the search text into clean words.
 * Characters that have a special meaning in Supabase filters are removed,
 * so typing e.g. "a,b" or "(x)" can't break the query.
 */
function toSearchWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((word) => word.replace(/[%*,.()"'\\:]/g, ''))
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * Search spots by make, model, city and year.
 * Every word must match somewhere: "porsche 911" finds make "Porsche" + model "911 GT3",
 * "bmw sofia" finds BMWs spotted in Sofia. A 4-digit word also matches the year ("2008 m3").
 */
export async function searchSpots(text: string, limit = 60): Promise<FeedSpot[]> {
  const words = toSearchWords(text);
  if (words.length === 0) return [];

  let query = supabase.from('spots').select(SPOT_COLUMNS);

  for (const word of words) {
    // `ilike` = case-insensitive LIKE; `*` is the wildcard (same as % in SQL).
    const conditions = [`make.ilike.*${word}*`, `model.ilike.*${word}*`, `city.ilike.*${word}*`];
    if (/^\d{4}$/.test(word)) conditions.push(`year.eq.${word}`);
    // Each .or(...) is one group; several groups are combined with AND.
    query = query.or(conditions.join(','));
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return toFeedSpots((data ?? []) as SpotRow[], { coverOnly: true });
}

/** One spot with all its photos, or null if it doesn't exist or isn't visible to you. */
export async function fetchSpot(id: string): Promise<FeedSpot | null> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [spot] = await toFeedSpots([data as SpotRow]);
  return spot;
}
