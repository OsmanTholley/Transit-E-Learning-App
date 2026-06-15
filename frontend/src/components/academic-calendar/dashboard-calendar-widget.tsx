"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { eventTypeColor, eventTypeLabel } from "@/lib/academic-calendar-service";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  eventType: keyof typeof eventTypeLabel extends never ? string : string;
  audience: string;
  location: string | null;
};

type DashboardCalendarWidgetProps = {
  role: "student" | "lecturer" | "admin";
  manageHref?: string;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardCalendarWidget({ role, manageHref }: DashboardCalendarWidgetProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const month = monthKey(cursor);

  useEffect(() => {
    scheduleEffectWork(() => setNowMs(Date.now()));
  }, [events]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const endpoint = role === "admin" ? `/api/admin/academic-calendar?month=${month}` : `/api/calendar?month=${month}`;
      const result = await requestApi<{ events: CalendarEvent[] }>(endpoint, { silent: true });
      setLoading(false);
      if (result.ok) setEvents(result.data.events);
    }
    scheduleEffectWork(() => load());
  }, [month, role]);

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string; count: number }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ day: null, key: `empty-${i}`, count: 0 });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayStart = new Date(year, monthIndex, day);
      const dayEnd = new Date(year, monthIndex, day, 23, 59, 59);
      const count = events.filter((event) => {
        const start = new Date(event.startAt);
        const end = event.endAt ? new Date(event.endAt) : start;
        return start <= dayEnd && end >= dayStart;
      }).length;
      cells.push({ day, key: `day-${day}`, count });
    }

    return cells;
  }, [cursor, events]);

  const upcoming = useMemo(() => {
    if (nowMs === null) return [];
    return events
      .filter((event) => new Date(event.endAt ?? event.startAt).getTime() >= nowMs)
      .slice(0, 5);
  }, [events, nowMs]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Academic calendar</h2>
          <p className="text-xs text-slate-500">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Next
          </button>
          {manageHref ? (
            <Link href={manageHref} className="rounded-md bg-[#0B3D91] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0a3580]">
              Manage
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => (
              <div
                key={cell.key}
                className={`min-h-10 rounded-lg border p-1 text-center text-xs ${
                  cell.day
                    ? cell.count > 0
                      ? "border-[#0B3D91]/20 bg-[#0B3D91]/5 font-semibold text-[#0B3D91]"
                      : "border-slate-100 text-slate-700"
                    : "border-transparent"
                }`}
              >
                {cell.day ? (
                  <>
                    <div>{cell.day}</div>
                    {cell.count > 0 ? <div className="text-[10px] text-[#0B3D91]">{cell.count} evt</div> : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming activities</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Loading schedule…</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No upcoming activities this month.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((event) => (
                <li key={event.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: eventTypeColor(event.eventType as never) }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-500">{formatEventDate(event.startAt)}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {eventTypeLabel(event.eventType as never)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
