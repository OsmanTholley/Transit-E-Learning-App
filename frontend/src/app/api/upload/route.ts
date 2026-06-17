import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { getValidatedUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_DEFAULT_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB — about 30 min at typical lecture quality

function uploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(os.tmpdir(), "transit-uploads");
}

function publicUrl(fileName: string) {
  return `/api/upload/file?name=${encodeURIComponent(fileName)}`;
}

const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/webm",
  "text/plain",
]);

export async function POST(request: NextRequest) {
  try {
    const user = await getValidatedUser(["lecturer", "admin", "student"]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const kind = request.nextUrl.searchParams.get("kind");
    const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_DEFAULT_BYTES;

    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > maxBytes) {
      const limitMb = Math.round(maxBytes / (1024 * 1024));
      return NextResponse.json(
        { error: `File exceeds ${limitMb} MB limit.` },
        { status: 400 }
      );
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
    }

    if (kind === "video" && !mime.startsWith("video/")) {
      return NextResponse.json({ error: "Upload a video file (MP4 or WebM)." }, { status: 400 });
    }

    const ext = path.extname(file.name) || "";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const uploadDir = uploadRoot();
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), buffer);

    const url = publicUrl(safeName);
    return NextResponse.json({
      url,
      fileName: file.name,
      fileType: mime,
      size: file.size,
    });
  } catch (error) {
    console.error("POST /api/upload:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
