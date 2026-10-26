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

export type NewSpot = {
  userId: string;
  imageUri: string;
  imageWidth: number;
  make: string;
  model: string;
  year: number | null;
  city: string | null;
  description: string | null;
  visibility: Visibility;
};

/** A spot ready to show in the feed: includes the author's username and a photo link. */
export type FeedSpot = Spot & {
  username: string;
  imageUrl: string | null;
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

/**
 * Upload the photo to storage, then save the spot row.
 * If saving the row fails, the uploaded photo is deleted so no orphan files are left.
 */
export async function uploadSpot(spot: NewSpot): Promise<void> {
  const preparedUri = await prepareImage(spot.imageUri, spot.imageWidth);
  const bytes = await new File(preparedUri).arrayBuffer();

  // Storage rule: users may only upload into a folder named after their own id.
  const path = `${spot.userId}/${makeFileName()}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('spots').insert({
    user_id: spot.userId,
    image_path: path,
    make: spot.make,
    model: spot.model,
    year: spot.year,
    city: spot.city,
    description: spot.description,
    visibility: spot.visibility,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw insertError;
  }
}

/**
 * Newest spots the current user is allowed to see.
 * The database security rules already filter out other people's "friends only" spots.
 */
export async function fetchFeed(limit = 50): Promise<FeedSpot[]> {
  // `profiles(username)` follows the user_id foreign key — like a JOIN in SQL.
  const { data, error } = await supabase
    .from('spots')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = (data ?? []) as (Spot & { profiles: { username: string } | null })[];
  if (rows.length === 0) return [];

  // The bucket is private, so each photo needs a temporary signed link.
  // One request for all photos instead of one per photo.
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      rows.map((row) => row.image_path),
      SIGNED_URL_SECONDS,
    );
  if (signError) throw signError;

  const urlByPath = new Map(signed.map((item) => [item.path, item.signedUrl]));

  return rows.map(({ profiles, ...spot }) => ({
    ...spot,
    username: profiles?.username ?? '?',
    imageUrl: urlByPath.get(spot.image_path) ?? null,
  }));
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
