"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { showError, showSuccess } from "@/lib/swal";
import type { LecturerMessageAudienceType } from "@/lib/lecturer-message-service";
import { FieldLabel, Panel, PrimaryButton, StatusBadge, StudentSection, TextInput } from "@/components/student-management/ui";

type MessageTargets = {
  departments: { id: string; name: string }[];
  lecturers: { id: string; label: string }[];
};

type SentMessage = {
  id: string;
  title: string;
  audience: string;
  recipientCount: number;
  sentAt: string;
  status: "Sent";
};

const AUDIENCE_OPTIONS: { value: LecturerMessageAudienceType; label: string }[] = [
  { value: "individual", label: "Individual lecturer" },
  { value: "department", label: "Department" },
  { value: "all", label: "All lecturers" },
];

export function LecturerMessagesPage() {
  const [targets, setTargets] = useState<MessageTargets | null>(null);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState<LecturerMessageAudienceType>("department");
  const [targetId, setTargetId] = useState("");

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/lecturers/messages", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load messages");
      setMessages(data.messages ?? []);
    } catch (err) {
      await showError("Load failed", err instanceof Error ? err.message : "Could not load recent messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [targetsRes, messagesRes] = await Promise.all([
          fetch("/api/lecturers/messages/targets", { credentials: "include" }),
          fetch("/api/lecturers/messages", { credentials: "include" }),
        ]);
        const targetsData = await targetsRes.json();
        const messagesData = await messagesRes.json();
        if (cancelled) return;
        if (!targetsRes.ok) throw new Error(targetsData.error ?? "Failed to load audience options");
        setTargets(targetsData);
        if (messagesRes.ok) {
          setMessages(messagesData.messages ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          await showError(
            "Setup failed",
            err instanceof Error ? err.message : "Could not load message settings.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTargets(false);
          setLoadingMessages(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const specificOptions = useMemo(() => {
    if (!targets) return [];
    switch (audienceType) {
      case "individual":
        return targets.lecturers.map((l) => ({ value: l.id, label: l.label }));
      case "department":
        return targets.departments.map((d) => ({ value: d.id, label: d.name }));
      default:
        return [];
    }
  }, [targets, audienceType]);

  const specificLabel = useMemo(() => {
    switch (audienceType) {
      case "individual":
        return "Lecturer";
      case "department":
        return "Department";
      default:
        return "";
    }
  }, [audienceType]);

  function handleAudienceChange(value: string) {
    setAudienceType(value as LecturerMessageAudienceType);
    setTargetId("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      await showError("Missing fields", "Title and message are required.");
      return;
    }

    if (audienceType !== "all" && !targetId) {
      await showError("Select target", `Choose a specific ${specificLabel.toLowerCase()}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lecturers/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audienceType,
          targetId: audienceType === "all" ? null : targetId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send message");

      await showSuccess("Message sent", data.message);
      setTitle("");
      setMessage("");
      setTargetId("");
      await loadMessages();
    } catch (err) {
      await showError("Send failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingTargets) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8">
        <p className="text-sm text-slate-500">Loading message settings…</p>
      </div>
    );
  }

  if (!targets) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Could not load audience options. Refresh the page or check your database connection.
      </div>
    );
  }

  return (
    <StudentSection>
      <Panel title="Send Message">
        <form className="grid max-w-2xl gap-4" onSubmit={handleSubmit}>
          <div>
            <FieldLabel>Title</FieldLabel>
            <TextInput
              placeholder="Meeting reminder, upload deadline, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <FieldLabel>Message</FieldLabel>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
              placeholder="Write your message to lecturers…"
            />
          </div>
          <div>
            <FieldLabel>Audience</FieldLabel>
            <select
              value={audienceType}
              onChange={(e) => handleAudienceChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {audienceType !== "all" ? (
            <div>
              <FieldLabel>Specific target</FieldLabel>
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
              >
                <option value="">Select {specificLabel.toLowerCase()}…</option>
                {specificOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {specificOptions.length === 0 ? (
                <p className="mt-2 text-xs text-amber-700">
                  No {specificLabel.toLowerCase()} options available. Add lecturers or departments first.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              This message will be delivered to every active lecturer account.
            </p>
          )}
          <div>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send Message"}
            </PrimaryButton>
          </div>
        </form>
      </Panel>

      <Panel title="Recent Messages" noPadding>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {["Title", "Audience", "Recipients", "Sent", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2.5 sm:px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingMessages ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading messages…
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No messages sent yet.
                  </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className="bg-white">
                    <td className="px-3 py-2.5 font-medium sm:px-4">{m.title}</td>
                    <td className="px-3 py-2.5 sm:px-4">{m.audience}</td>
                    <td className="px-3 py-2.5 text-slate-600 sm:px-4">{m.recipientCount}</td>
                    <td className="px-3 py-2.5 text-slate-500 sm:px-4">{m.sentAt}</td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </StudentSection>
  );
}
