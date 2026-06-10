"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardCalendarWidget } from "@/components/academic-calendar/dashboard-calendar-widget";
import { requestApi } from "@/lib/fetch-api";
import { CALENDAR_EVENT_TYPES, eventTypeLabel } from "@/lib/academic-calendar-service";
import { showError, showSuccess } from "@/lib/swal";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  eventType: string;
  audience: string;
  location: string | null;
};

export function AdminAcademicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [eventType, setEventType] = useState("ACTIVITY");
  const [audience, setAudience] = useState("ALL");
  const [location, setLocation] = useState("");

  const load = async () => {
    const result = await requestApi<{ events: CalendarEvent[] }>("/api/admin/academic-calendar", { silent: true });
    if (result.ok) setEvents(result.data.events);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const result = await requestApi("/api/admin/academic-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, startAt, endAt: endAt || undefined, eventType, audience, location }),
      silent: true,
    });

    if (!result.ok) {
      await showError("Could not save event", result.offline ? "You are offline." : result.message);
      return;
    }

    await showSuccess("Event added", "The academic schedule has been updated.");
    setTitle("");
    setDescription("");
    setStartAt("");
    setEndAt("");
    setLocation("");
    void load();
  };

  const handleDelete = async (id: string) => {
    const result = await requestApi(`/api/admin/academic-calendar?id=${id}`, { method: "DELETE", silent: true });
    if (!result.ok) {
      await showError("Delete failed", result.offline ? "You are offline." : result.message);
      return;
    }
    void load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Academic calendar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set exams, holidays, and campus activities. Students and lecturers see events on their dashboards.
        </p>
      </div>

      <DashboardCalendarWidget role="admin" />

      <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Add schedule activity</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Activity title"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {CALENDAR_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {eventTypeLabel(type)}
              </option>
            ))}
          </select>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">Everyone</option>
            <option value="STUDENTS">Students only</option>
            <option value="LECTURERS">Lecturers only</option>
            <option value="ADMIN">Admin only</option>
          </select>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <button type="submit" className="rounded-md bg-[#0B3D91] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3580] md:col-span-2">
            Publish to calendar
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">All scheduled activities</h2>
        <div className="mt-4 space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No activities scheduled yet.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(event.startAt).toLocaleString()} · {eventTypeLabel(event.eventType as never)} · {event.audience}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(event.id)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
