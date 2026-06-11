import { NextRequest, NextResponse } from "next/server";
import { CalendarAudience, CalendarEventType } from "@prisma/client";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  mapCalendarEvent,
  updateCalendarEvent,
} from "@/lib/academic-calendar-service";
import { requireAdminUser } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get("month");
    const from = month
      ? new Date(`${month}-01T00:00:00`)
      : new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1);
    const to = month
      ? new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59)
      : new Date(from.getFullYear() + 1, from.getMonth(), 0, 23, 59, 59);

    const events = await listCalendarEvents({ role: "admin", from, to, limit: 500 });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/admin/academic-calendar:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load calendar." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title?.trim() || !body.startAt) {
      return NextResponse.json({ error: "Title and start date are required." }, { status: 400 });
    }

    const event = await createCalendarEvent({
      title: body.title,
      description: body.description,
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      eventType: body.eventType as CalendarEventType | undefined,
      audience: body.audience as CalendarAudience | undefined,
      location: body.location,
      createdById: admin.id,
    });

    return NextResponse.json({ ok: true, event: mapCalendarEvent(event) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create event.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Event id is required." }, { status: 400 });
    }

    const event = await updateCalendarEvent(body.id, {
      title: body.title,
      description: body.description,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt === null ? null : body.endAt ? new Date(body.endAt) : undefined,
      eventType: body.eventType as CalendarEventType | undefined,
      audience: body.audience as CalendarAudience | undefined,
      location: body.location,
    });

    return NextResponse.json({ ok: true, event: mapCalendarEvent(event) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update event.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const eventId = request.nextUrl.searchParams.get("id");
    if (!eventId) {
      return NextResponse.json({ error: "Event id is required." }, { status: 400 });
    }

    await deleteCalendarEvent(eventId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete event." }, { status: 400 });
  }
}
