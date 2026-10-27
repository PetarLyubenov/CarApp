/**
 * Turn anything that was thrown into a readable message.
 *
 * Supabase database errors are plain objects with a `message` field, not `Error`
 * instances, so `e instanceof Error` alone would hide the real reason.
 */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
    return e.message;
  }
  return fallback;
}
