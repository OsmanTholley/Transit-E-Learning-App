/**
 * Supabase Storage client (server-side only).
 *
 * Files are stored in a public Supabase bucket so they persist across
 * Netlify redeploys. The service role key is NEVER sent to the browser.
 *
 * Required environment variables (set in Netlify dashboard):
 *   SUPABASE_URL              — e.g. https://xyzabc.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — from Project Settings → API → service_role
 *   SUPABASE_STORAGE_BUCKET   — bucket name, e.g. "transit-uploads"
 */

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
        "Add them in your Netlify dashboard → Site configuration → Environment variables."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function getBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "transit-uploads";
}

export type UploadResult =
  | { url: string; path: string }
  | { error: string };

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the permanent public URL on success.
 */
export async function uploadToStorage(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  try {
    const supabase = getSupabaseAdmin();
    const bucket = getBucketName();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { error: error.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return { url: data.publicUrl, path: fileName };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Storage upload failed.";
    console.error("uploadToStorage:", msg);
    return { error: msg };
  }
}

/**
 * Delete a file from Supabase Storage by its stored path.
 * Silently ignores errors (file may already be gone).
 */
export async function deleteFromStorage(filePath: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const bucket = getBucketName();
    await supabase.storage.from(bucket).remove([filePath]);
  } catch (err) {
    console.error("deleteFromStorage:", err);
  }
}

/**
 * Check whether Supabase Storage is configured.
 * Used to gracefully fall back to local storage in dev if env vars are missing.
 */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
