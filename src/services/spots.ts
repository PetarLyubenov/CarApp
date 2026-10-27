/**
 * Spots service — all database and storage work for spotted-car photos.
 *
 * Screens call these functions instead of talking to Supabase directly
 * (like a repository/service class in C#), so the screens stay focused on the UI.
 */
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';
import type { Spot, Visibility } from '@/types/database';

const BUCKET = 'spots';
/** Photos wider than this are scaled down: smaller uploads, faster feed. */
const MAX_WIDTH = 1600;
/** How long a signed photo link stays valid. */
const SIGNED_URL_SECONDS = 60 * 60;

/** Most photos one spot can have. */
export const MAX_PHOTOS = 10;

/** A photo picked on the phone, not uploaded yet. */
export type LocalPhoto = { uri: string; width: number };

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
 * Re-encode the photo as a new JPEG.
 * Besides resizing, this drops the original EXIF metadata — including the GPS location
 * where the photo was taken — so we never publish where someone lives or parks.
 */
async function prepareImage(uri: string, width: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_WIDTH) {
    context.resize({ width: MAX_WIDTH, height: null }); // height keeps the aspect ratio
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
  });
  return result.uri;
}

/** Short random file name, e.g. "1730000000000-k3j9x2.jpg". */
function makeFileName(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}.jpg`;
}

/** Prepare one photo and upload it. Returns its path in storage. */
async function uploadPhoto(userId: string, photo: LocalPhoto): Promise<string> {
  const preparedUri = await prepareImage(photo.uri, photo.width);
  const bytes = await new File(preparedUri).arrayBuffer();

  // Storage rule: users may only upload into a folder named after their own id.
  const path = `${userId}/${makeFileName()}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

/**
 * Upload all photos, then save the spot and its photo list.
 * If anything fails half-way, everything already uploaded is removed again,
 * so we never leave a spot without photos or photos without a spot.
 */
export async function uploadSpot(spot: NewSpot): Promise<void> {
  if (spot.photos.length === 0) throw new Error('A spot needs at least one photo.');

  const uploadedPaths: string[] = [];
  let spotId: string | null = null;

  try {
    // One after another (not all at once) to keep memory and mobile data use low.
    for (const photo of spot.photos) {
      uploadedPaths.push(await uploadPhoto(spot.userId, photo));
    }

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
    if (uploadedPaths.length > 0) await supabase.storage.from(BUCKET).remove(uploadedPaths);
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
      const paths =
        row.photos.length > 0
          ? [...row.photos].sort((a, b) => a.position - b.position).map((p) => p.image_path)
          : [row.image_path];
      return [row.id, coverOnly ? paths.slice(0, 1) : paths];
    }),
  );

  // The bucket is private, so each photo needs a temporary signed link.
  // One request for all photos instead of one per photo.
  const allPaths = [...pathsBySpot.values()].flat();
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(allPaths, SIGNED_URL_SECONDS);
  if (signError) throw signError;

  const urlByPath = new Map(signed.map((item) => [item.path, item.signedUrl]));

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
 */
export async function fetchFeed(limit = 50): Promise<FeedSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return toFeedSpots((data ?? []) as SpotRow[]);
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

/** The current user's default visibility, used to pre-select the upload form. */
export async function fetchDefaultVisibility(userId: string): Promise<Visibility> {
  const { data } = await supabase
    .from('profiles')
    .select('default_visibility')
    .eq('id', userId)
    .single();
  return (data?.default_visibility as Visibility | undefined) ?? 'public';
}
