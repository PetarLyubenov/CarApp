/**
 * Garage service — the user's own cars, their photos and modifications.
 */
import { supabase } from '@/lib/supabase';
import {
  orderedPaths,
  removePhotos,
  signPhotoUrls,
  uploadPhotos,
  type LocalPhoto,
} from '@/services/photos';
import type { GarageCar, ModCategory, Modification, Visibility } from '@/types/database';

const BUCKET = 'garage';

export type NewCar = {
  userId: string;
  /** In display order — the first photo becomes the cover. */
  photos: LocalPhoto[];
  make: string;
  model: string;
  year: number | null;
  nickname: string | null;
  engine: string | null;
  horsepower: number | null;
  transmission: string | null;
  drivetrain: string | null;
  color: string | null;
  description: string | null;
  visibility: Visibility;
};

/** A car in the garage list: cover photo and how many mods it has. */
export type CarSummary = GarageCar & {
  imageUrls: string[];
  modsCount: number;
};

/** Everything about one car, for its detail screen. */
export type CarDetails = GarageCar & {
  username: string;
  imageUrls: string[];
  /** Storage paths of all photos — needed to delete the files with the car. */
  photoPaths: string[];
  /** Newest first. */
  modifications: Modification[];
};

export type NewModification = {
  carId: string;
  category: ModCategory;
  title: string;
  description: string | null;
  installedOn: string | null; // 'YYYY-MM-DD'
  cost: number | null;
};

type PhotoRow = { image_path: string; position: number };

/** All cars of one user, oldest first (the order they were added). */
export async function fetchCars(userId: string): Promise<CarSummary[]> {
  // `mods:modifications(count)` asks the database to count the mods instead of
  // downloading them all — like SELECT COUNT(*) in a subquery.
  const { data, error } = await supabase
    .from('garage_cars')
    .select('*, photos:garage_car_photos(image_path, position), mods:modifications(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  type Row = GarageCar & { photos: PhotoRow[]; mods: { count: number }[] };
  const rows = (data ?? []) as Row[];

  // Only the cover is needed for the list.
  const coverBy = new Map(rows.map((row) => [row.id, orderedPaths(row.photos, row.cover_image_path)[0]]));
  const urlByPath = await signPhotoUrls(BUCKET, [...coverBy.values()].filter(Boolean));

  return rows.map(({ photos: _photos, mods, ...car }) => {
    const cover = coverBy.get(car.id);
    const url = cover ? urlByPath.get(cover) : undefined;
    return { ...car, imageUrls: url ? [url] : [], modsCount: mods[0]?.count ?? 0 };
  });
}

/** One car with all photos and mods, or null if it doesn't exist or isn't visible to you. */
export async function fetchCar(id: string): Promise<CarDetails | null> {
  const { data, error } = await supabase
    .from('garage_cars')
    .select(
      '*, owner:profiles!garage_cars_user_id_fkey(username), photos:garage_car_photos(image_path, position), modifications(*)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { owner, photos, modifications, ...car } = data as GarageCar & {
    owner: { username: string } | null;
    photos: PhotoRow[];
    modifications: Modification[];
  };

  const photoPaths = orderedPaths(photos, car.cover_image_path);
  const urlByPath = await signPhotoUrls(BUCKET, photoPaths);

  // Newest mod first; mods without a date go after the dated ones.
  const sortedMods = [...modifications].sort((a, b) => {
    if (a.installed_on && b.installed_on) return b.installed_on.localeCompare(a.installed_on);
    if (a.installed_on) return -1;
    if (b.installed_on) return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  return {
    ...car,
    username: owner?.username ?? '?',
    imageUrls: photoPaths.map((p) => urlByPath.get(p)).filter((u): u is string => Boolean(u)),
    photoPaths,
    modifications: sortedMods,
  };
}

/**
 * Upload the photos, then save the car and its photo list. Returns the new car's id.
 * If saving fails, the uploaded photos are removed again.
 */
export async function createCar(car: NewCar): Promise<string> {
  const paths = await uploadPhotos(BUCKET, car.userId, car.photos);
  let carId: string | null = null;

  try {
    const { data, error } = await supabase
      .from('garage_cars')
      .insert({
        user_id: car.userId,
        make: car.make,
        model: car.model,
        year: car.year,
        nickname: car.nickname,
        engine: car.engine,
        horsepower: car.horsepower,
        transmission: car.transmission,
        drivetrain: car.drivetrain,
        color: car.color,
        description: car.description,
        cover_image_path: paths[0] ?? null, // a car may have no photos yet
        visibility: car.visibility,
      })
      .select('id')
      .single();
    if (error) throw error;
    carId = data.id as string;

    if (paths.length > 0) {
      const { error: photosError } = await supabase
        .from('garage_car_photos')
        .insert(paths.map((path, index) => ({ car_id: carId, image_path: path, position: index })));
      if (photosError) throw photosError;
    }
    return carId;
  } catch (e) {
    // Deleting the car also deletes its photo rows and mods (on delete cascade).
    if (carId) await supabase.from('garage_cars').delete().eq('id', carId);
    await removePhotos(BUCKET, paths);
    throw e;
  }
}

/** Delete a car with everything attached to it, including the photo files. */
export async function deleteCar(car: CarDetails): Promise<void> {
  const { error } = await supabase.from('garage_cars').delete().eq('id', car.id);
  if (error) throw error;
  await removePhotos(BUCKET, car.photoPaths);
}

export async function addModification(mod: NewModification): Promise<void> {
  const { error } = await supabase.from('modifications').insert({
    car_id: mod.carId,
    category: mod.category,
    title: mod.title,
    description: mod.description,
    installed_on: mod.installedOn,
    cost: mod.cost,
  });
  if (error) throw error;
}

export async function deleteModification(id: string): Promise<void> {
  const { error } = await supabase.from('modifications').delete().eq('id', id);
  if (error) throw error;
}
