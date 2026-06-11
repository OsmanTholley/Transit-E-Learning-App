import { CalendarAudience, CalendarEventType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CalendarRole = "student" | "lecturer" | "admin";

const audienceForRole: Record<CalendarRole, CalendarAudience[]> = {
  student: [CalendarAudience.ALL, CalendarAudience.STUDENTS],
  lecturer: [CalendarAudience.ALL, CalendarAudience.LECTURERS],
  admin: [CalendarAudience.ALL, CalendarAudience.ADMIN, CalendarAudience.STUDENTS, CalendarAudience.LECTURERS],
};

export function mapCalendarEvent(event: {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  eventType: CalendarEventType;
  audience: CalendarAudience;
  location: string | null;
}) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    eventType: event.eventType,
    audience: event.audience,
    location: event.location,
  };
}

export async function listCalendarEvents(params: {
  role: CalendarRole;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const from = params.from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = params.to ?? new Date(from.getFullYear(), from.getMonth() + 2, 0, 23, 59, 59);

  const events = await prisma.academicCalendarEvent.findMany({
    where: {
      audience: { in: audienceForRole[params.role] },
      startAt: { lte: to },
      OR: [{ endAt: { gte: from } }, { endAt: null, startAt: { gte: from } }],
    },
    orderBy: { startAt: "asc" },
    take: params.limit ?? 100,
  });

  return events.map(mapCalendarEvent);
}

export async function createCalendarEvent(params: {
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date;
  eventType?: CalendarEventType;
  audience?: CalendarAudience;
  location?: string;
  createdById: string;
}) {
  if (!params.title.trim()) {
    throw new Error("Event title is required.");
  }

  if (params.endAt && params.endAt <= params.startAt) {
    throw new Error("End time must be after start time.");
  }

  return prisma.academicCalendarEvent.create({
    data: {
      title: params.title.trim(),
      description: params.description?.trim() || null,
      startAt: params.startAt,
      endAt: params.endAt ?? null,
      eventType: params.eventType ?? CalendarEventType.ACTIVITY,
      audience: params.audience ?? CalendarAudience.ALL,
      location: params.location?.trim() || null,
      createdById: params.createdById,
    },
  });
}

export async function updateCalendarEvent(
  eventId: string,
  params: {
    title?: string;
    description?: string | null;
    startAt?: Date;
    endAt?: Date | null;
    eventType?: CalendarEventType;
    audience?: CalendarAudience;
    location?: string | null;
  },
) {
  const existing = await prisma.academicCalendarEvent.findUnique({ where: { id: eventId } });
  if (!existing) throw new Error("Event not found.");

  const title = params.title?.trim();
  if (title !== undefined && !title) throw new Error("Event title is required.");

  const startAt = params.startAt ?? existing.startAt;
  const endAt = params.endAt === undefined ? existing.endAt : params.endAt;
  if (endAt && endAt <= startAt) {
    throw new Error("End time must be after start time.");
  }

  return prisma.academicCalendarEvent.update({
    where: { id: eventId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(params.description !== undefined ? { description: params.description?.trim() || null } : {}),
      ...(params.startAt !== undefined ? { startAt: params.startAt } : {}),
      ...(params.endAt !== undefined ? { endAt: params.endAt } : {}),
      ...(params.eventType !== undefined ? { eventType: params.eventType } : {}),
      ...(params.audience !== undefined ? { audience: params.audience } : {}),
      ...(params.location !== undefined ? { location: params.location?.trim() || null } : {}),
    },
  });
}

export async function deleteCalendarEvent(eventId: string) {
  await prisma.academicCalendarEvent.delete({ where: { id: eventId } });
}

export const CALENDAR_EVENT_TYPES = [
  CalendarEventType.ACADEMIC,
  CalendarEventType.EXAM,
  CalendarEventType.REGISTRATION,
  CalendarEventType.HOLIDAY,
  CalendarEventType.ACTIVITY,
  CalendarEventType.OTHER,
] as const;

export function eventTypeLabel(type: CalendarEventType): string {
  const labels: Record<CalendarEventType, string> = {
    ACADEMIC: "Academic",
    EXAM: "Exam",
    REGISTRATION: "Registration",
    HOLIDAY: "Holiday",
    ACTIVITY: "Activity",
    OTHER: "Other",
  };
  return labels[type];
}

export function eventTypeColor(type: CalendarEventType): string {
  const colors: Record<CalendarEventType, string> = {
    ACADEMIC: "#0B3D91",
    EXAM: "#C4314B",
    REGISTRATION: "#059669",
    HOLIDAY: "#d97706",
    ACTIVITY: "#7c3aed",
    OTHER: "#64748b",
  };
  return colors[type];
}

export function roleFromUserRole(role: Role): CalendarRole | null {
  if (role === Role.STUDENT) return "student";
  if (role === Role.LECTURER) return "lecturer";
  if (role === Role.ADMIN) return "admin";
  return null;
}
