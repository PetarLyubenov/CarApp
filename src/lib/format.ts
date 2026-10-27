/**
 * Formatting and parsing helpers for prices, dates and links.
 */

/** "450" or "450.50" with a € sign. */
export function formatEuro(amount: number): string {
  return `€${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/** e.g. "Sat, 17 May · 10:00" in the phone's language and time zone. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

/**
 * Turn "2026-05-17" + "10:00" into a Date in the phone's time zone.
 * Returns null for anything that isn't a real date/time (e.g. 2026-02-30 or 25:00).
 */
export function parseLocalDateTime(dateText: string, timeText: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeText.trim());
  if (!dateMatch || !timeMatch) return null;

  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hours, minutes] = timeMatch.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);

  // JavaScript quietly turns "Feb 30" into "Mar 2" — reject that by checking the parts.
  const isSame =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes;
  return isSame ? date : null;
}

/** Add "https://" if missing; returns null if it still doesn't look like a web link. */
export function normalizeUrl(text: string): string | null {
  const trimmed = text.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(withScheme) ? withScheme : null;
}
