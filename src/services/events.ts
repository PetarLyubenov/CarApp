/**
 * Events service — car shows, meets and track days, plus who's going.
 */
import { supabase } from '@/lib/supabase';
import { publicPhotoUrl, removePhotos, uploadPhotos, type LocalPhoto } from '@/services/photos';
import type { AttendanceStatus, CarEvent, EventType } from '@/types/database';

const BUCKET = 'events';
/** Events without an end time stay listed this long after they start. */
const DEFAULT_DURATION_HOURS = 12;

export type Organizer = {
  username: string;
  display_name: string | null;
  is_verified: boolean;
};

/** An event with everything the list and detail screens show. */
export type EventItem = CarEvent & {
  organizer: Organizer | null;
  coverUrl: string | null;
  goingCount: number;
  interestedCount: number;
  /** The current user's answer, or null if they haven't answered. */
  myStatus: AttendanceStatus | null;
};

export type NewEvent = {
  userId: string;
  cover: LocalPhoto | null;
  title: string;
  eventType: EventType;
  brand: string | null;
  locationName: string;
  address: string | null;
  startsAt: Date;
  endsAt: Date | null;
  price: number | null;
  ticketUrl: string | null;
  description: string | null;
};

// `organizer:profiles!events_created_by_fkey(...)` follows the created_by link.
// The hint is needed because events and profiles are also linked through event_attendees.
const EVENT_COLUMNS =
  '*, organizer:profiles!events_created_by_fkey(username, display_name, is_verified), attendees:event_attendees(user_id, status)';

type EventRow = CarEvent & {
  organizer: Organizer | null;
  attendees: { user_id: string; status: AttendanceStatus }[];
};

function toEventItem(row: EventRow, userId: string): EventItem {
  const { attendees, ...event } = row;
  return {
    ...event,
    coverUrl: event.cover_image_path ? publicPhotoUrl(BUCKET, event.cover_image_path) : null,
    goingCount: attendees.filter((a) => a.status === 'going').length,
    interestedCount: attendees.filter((a) => a.status === 'interested').length,
    myStatus: attendees.find((a) => a.user_id === userId)?.status ?? null,
  };
}

/** Events that haven't finished yet, soonest first. */
export async function fetchUpcomingEvents(userId: string): Promise<EventItem[]> {
  const now = new Date().toISOString();
  const recentStart = new Date(Date.now() - DEFAULT_DURATION_HOURS * 3600 * 1000).toISOString();

  // Not finished = ends in the future, or (no end time and) started less than 12 h ago.
  // Dates contain ":" and ".", so they are wrapped in double quotes inside .or().
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .or(`ends_at.gte."${now}",and(ends_at.is.null,starts_at.gte."${recentStart}")`)
    .order('starts_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as EventRow[]).map((row) => toEventItem(row, userId));
}

/** One event, or null if it doesn't exist. */
export async function fetchEvent(id: string, userId: string): Promise<EventItem | null> {
  const { data, error } = await supabase.from('events').select(EVENT_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toEventItem(data as EventRow, userId) : null;
}

/** Save a new event (only verified organizations and admins are allowed). Returns its id. */
export async function createEvent(event: NewEvent): Promise<string> {
  const coverPaths = event.cover ? await uploadPhotos(BUCKET, event.userId, [event.cover]) : [];

  const { data, error } = await supabase
    .from('events')
    .insert({
      created_by: event.userId,
      title: event.title,
      event_type: event.eventType,
      brand: event.brand,
      location_name: event.locationName,
      address: event.address,
      starts_at: event.startsAt.toISOString(),
      ends_at: event.endsAt?.toISOString() ?? null,
      price: event.price,
      ticket_url: event.ticketUrl,
      description: event.description,
      cover_image_path: coverPaths[0] ?? null,
    })
    .select('id')
    .single();

  if (error) {
    await removePhotos(BUCKET, coverPaths);
    throw error;
  }
  return data.id as string;
}

export async function deleteEvent(event: EventItem): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', event.id);
  if (error) throw error;
  if (event.cover_image_path) await removePhotos(BUCKET, [event.cover_image_path]);
}

/** Mark yourself as going / interested, or pass null to remove your answer. */
export async function setAttendance(
  eventId: string,
  userId: string,
  status: AttendanceStatus | null,
): Promise<void> {
  if (status === null) {
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }

  // upsert = insert, or update the existing row if this user already answered.
  const { error } = await supabase
    .from('event_attendees')
    .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: 'event_id,user_id' });
  if (error) throw error;
}
