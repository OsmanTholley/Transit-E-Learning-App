import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDatabaseError } from "@/lib/db-errors";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (toDatabaseError(error)) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
