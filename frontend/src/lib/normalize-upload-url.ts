/**
 * normalizeUploadUrl
 *
 * Converts legacy upload URLs stored in the database to the clean
 * /uploads/<filename> path that Next.js <Image> accepts without any
 * localPatterns query-string configuration.
 *
 * Before: /api/upload/file?name=1781719197453-ygbgrf6j.jpg
 * After:  /uploads/1781719197453-ygbgrf6j.jpg
 *
 * External URLs (https://...) and already-clean /uploads/ paths are
 * returned unchanged.
 */
export function normalizeUploadUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already an external URL (Supabase, CDN, etc.) — leave as-is
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // Already using the clean /uploads/ path — leave as-is
  if (url.startsWith("/uploads/")) return url;

  // Legacy local API query-string format → convert to clean path
  // e.g. /api/upload/file?name=1781719197453-ygbgrf6j.jpg
  if (url.startsWith("/api/upload/file")) {
    try {
      const params = new URLSearchParams(url.split("?")[1] ?? "");
      const name = params.get("name");
      if (name) return `/uploads/${encodeURIComponent(name)}`;
    } catch {
      // fall through
    }
  }

  return url;
}
