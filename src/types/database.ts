/**
 * TypeScript types that mirror the tables in supabase/schema.sql.
 * Like C# model classes: they give autocomplete and catch typos at compile time.
 * Keep them in sync when the schema changes.
 */

export type UserRole = 'user' | 'organization' | 'admin';
export type Visibility = 'public' | 'friends';
export type FriendshipStatus = 'pending' | 'accepted';
export type EventType = 'show' | 'meet' | 'track_day' | 'other';
export type AttendanceStatus = 'going' | 'interested';
export type ModCategory =
  | 'engine'
  | 'exhaust'
  | 'suspension'
  | 'wheels'
  | 'brakes'
  | 'interior'
  | 'exterior'
  | 'electronics'
  | 'other';

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_verified: boolean;
  default_visibility: Visibility;
  created_at: string;
};

export type Friendship = {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

/** A photo of a car someone spotted. */
export type Spot = {
  id: string;
  user_id: string;
  image_path: string;
  make: string;
  model: string;
  year: number | null;
  description: string | null;
  city: string | null;
  visibility: Visibility;
  created_at: string;
};

export type Comment = {
  id: string;
  spot_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

/** A car in the user's own garage. */
export type GarageCar = {
  id: string;
  user_id: string;
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
  cover_image_path: string | null;
  visibility: Visibility;
  created_at: string;
};

export type GarageCarPhoto = {
  id: string;
  car_id: string;
  image_path: string;
  position: number;
  created_at: string;
};

export type Modification = {
  id: string;
  car_id: string;
  category: ModCategory;
  title: string;
  description: string | null;
  installed_on: string | null; // 'YYYY-MM-DD'
  cost: number | null;
  created_at: string;
};

export type CarEvent = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_type: EventType;
  brand: string | null;
  location_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  starts_at: string;
  ends_at: string | null;
  price: number | null;
  currency: string;
  ticket_url: string | null;
  cover_image_path: string | null;
  created_at: string;
};

export type EventAttendee = {
  event_id: string;
  user_id: string;
  status: AttendanceStatus;
  created_at: string;
};
