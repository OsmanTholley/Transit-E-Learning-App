/**
 * GET /api/upload/file?name=<filename>
 *
 * Legacy file-serving route kept for backward compatibility.
 * URLs stored in the database before Supabase was introduced used this path.
 *
 * Strategy:
 *   1. If Supabase is configured → redirect to the Supabase public URL
 *      (the file lives in the cloud bucket, not the local disk).
 *   2. Otherwise → read from local filesystem (dev fallback).
 */

import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser } from "@/lib/auth";
import { isStorageConfigured } from "@/lib/supabase-storage";
import { createClient } from "@supabase/supabase-js";

// Local filesystem imports (dev fallback only)
import { readFile, stat } from "fs/promises";
import os from "os";
import path from "path";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4":  "video/mp4",
  ".webm": "video/webm",
  ".txt":  "text/plain",
  ".doc":  "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt":  "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function localUploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(os.tmpdir(), "transit-uploads");
}

function safeFileName(name: string): string | null {
  const base = path.basename(decodeURIComponent(name));
  return /^[\w.-]+$/.test(base) ? base : null;
}

export async function GET(request: NextRequest) {
  const user = await getValidatedUser(["lecturer", "admin", "student"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rawName = request.nextUrl.searchParams.get("name");
  if (!rawName) {
    return NextResponse.json({ error: "Missing file name." }, { status: 400 });
  }

  const fileName = safeFileName(rawName);
  if (!fileName) {
    return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
  }

  // ── Cloud: redirect to Supabase public URL ────────────────────────────────
  if (isStorageConfigured()) {
    const url     = process.env.SUPABASE_URL!.trim();
    const key     = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
    const bucket  = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "transit-uploads";
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return NextResponse.redirect(data.publicUrl, { status: 302 });
  }

  // ── Local filesystem fallback (development) ───────────────────────────────
  const filePath = path.join(localUploadRoot(), fileName);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const data = await readFile(filePath);
    const ext  = path.extname(fileName).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type":  MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
