import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import os from "os";
import path from "path";
import { getValidatedUser } from "@/lib/auth";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain",
};

function uploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(os.tmpdir(), "transit-uploads");
}

function safeFileName(name: string) {
  const base = path.basename(name);
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

  const filePath = path.join(uploadRoot(), fileName);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const data = await readFile(filePath);
    const ext = path.extname(fileName).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
