/**
 * Photo helpers shared by spots and the garage: prepare, upload, delete and sign links.
 * Each feature has its own private storage bucket ('spots', 'garage').
 */
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

export type PhotoBucket = 'spots' | 'garage';

/** Most photos one spot or car can have. */
export const MAX_PHOTOS = 10;

/** A photo picked on the phone, not uploaded yet. */
export type LocalPhoto = { uri: string; width: number };

/** Photos wider than this are scaled down: smaller uploads, faster loading. */
const MAX_WIDTH = 1600;
/** How long a signed photo link stays valid. */
const SIGNED_URL_SECONDS = 60 * 60;

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
 * Prepare and upload photos one after another (not all at once) to keep memory and
 * mobile data use low. Returns their storage paths in the same order.
 * If one fails, the ones already uploaded are deleted again before the error is thrown.
 */
export async function uploadPhotos(
  bucket: PhotoBucket,
  userId: string,
  photos: LocalPhoto[],
): Promise<string[]> {
  const paths: string[] = [];
  try {
    for (const photo of photos) {
      const preparedUri = await prepareImage(photo.uri, photo.width);
      const bytes = await new File(preparedUri).arrayBuffer();

      // Storage rule: users may only upload into a folder named after their own id.
      const path = `${userId}/${makeFileName()}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, bytes, { contentType: 'image/jpeg' });
      if (error) throw error;
      paths.push(path);
    }
    return paths;
  } catch (e) {
    await removePhotos(bucket, paths);
    throw e;
  }
}

/** Delete photos from storage. Does nothing for an empty list. */
export async function removePhotos(bucket: PhotoBucket, paths: string[]): Promise<void> {
  if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
}

/**
 * The buckets are private, so every photo needs a temporary signed link.
 * One request for all photos instead of one per photo. Returns path -> link.
 */
export async function signPhotoUrls(bucket: PhotoBucket, paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw error;
  const urls = new Map<string, string>();
  for (const item of data) {
    // A photo that couldn't be signed (e.g. deleted file) has no path/link — skip it.
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

/** Photo rows sorted by position, as paths. Falls back to `cover` when there are none. */
export function orderedPaths(photos: { image_path: string; position: number }[], cover: string | null): string[] {
  if (photos.length > 0) {
    return [...photos].sort((a, b) => a.position - b.position).map((p) => p.image_path);
  }
  return cover ? [cover] : [];
}
