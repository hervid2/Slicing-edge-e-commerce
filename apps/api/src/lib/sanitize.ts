/**
 * Strips HTML tags and dangerous character sequences from a string.
 *
 * Used on all user-generated text before persistence (review comments,
 * display names, etc.) to prevent stored XSS attacks.
 *
 * Note: the frontend uses React, which auto-escapes all rendered strings.
 * This function adds a server-side defence-in-depth layer so the raw DB
 * values are already safe even if consumed by another client.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')        // remove HTML tags
    .replace(/&lt;/gi, '<')         // decode encoded entities before re-stripping
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '')        // second pass after entity decoding
    .replace(/javascript:/gi, '')   // strip js: pseudo-protocol
    .replace(/on\w+\s*=/gi, '')     // strip inline event handlers (onclick=, etc.)
    .trim();
}

/**
 * Sanitizes an object's string values recursively — shallow one-level only.
 * Handy for sanitising request body objects before persistence.
 */
export function sanitizeStrings<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result) as (keyof T)[]) {
    if (typeof result[key] === 'string') {
      (result[key] as unknown) = stripHtml(result[key] as string);
    }
  }
  return result;
}
