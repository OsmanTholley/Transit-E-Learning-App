"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { showError, showSuccess } from "@/lib/swal";
import type { MessageAudienceType } from "@/lib/student-message-service";
import { FieldLabel, Panel, PrimaryButton, StatusBadge, StudentSection, TextInput } from "./ui";

type MessageTargets = {
  departments: { id: string; name: string }[];
  students: { id: string; label: string }[];
  years: string[];
};

type SentMessage = {
  id: string;
  title: string;
  audience: string;
  recipientCount: number;
  sentAt: string;
  status: "Sent";
};

const AUDIENCE_OPTIONS: { value: MessageAudienceType; label: string }[] = [
  { value: "individual", label: "Individual student" },
  { value: "department", label: "Department" },
  { value: "year", label: "Year" },
  { value: "all", label: "All students" },
];

export function StudentMessagesPage() {
  const [targets, setTargets] = useState<MessageTargets | null>(null);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState<MessageAudienceType>("department");
  const [targetId, setTargetId] = useState("");
  const [targetValue, setTargetValue] = useState("");

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/students/messages", { credentials: "include" });
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
          fetch("/api/students/messages/targets", { credentials: "include" }),
          fetch("/api/students/messages", { credentials: "include" }),
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
        return targets.students.map((s) => ({ value: s.id, label: s.label }));
      case "department":
        return targets.departments.map((d) => ({ value: d.id, label: d.name }));
      case "year":
        return targets.years.map((y) => ({ value: y, label: y }));
      default:
        return [];
    }
  }, [targets, audienceType]);

  const specificLabel = useMemo(() => {
    switch (audienceType) {
      case "individual":
        return "Student";
      case "department":
        return "Department";
      case "year":
        return "Year";
      default:
        return "";
    }
  }, [audienceType]);

  function handleAudienceChange(value: string) {
    const next = value as MessageAudienceType;
    setAudienceType(next);
    setTargetId("");
    setTargetValue("");
  }

  function handleSpecificChange(value: string) {
    if (audienceType === "year") {
      setTargetValue(value);
      setTargetId("");
    } else {
      setTargetId(value);
      setTargetValue("");
    }
  }

  const specificValue = audienceType === "year" ? targetValue : targetId;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      await showError("Missing fields", "Title and message are required.");
      return;
    }

    if (audienceType !== "all" && !specificValue) {
      await showError("Select target", `Choose a specific ${specificLabel.toLowerCase()}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/students/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audienceType,
          targetId: audienceType === "year" ? null : targetId || null,
          targetValue: audienceType === "year" ? targetValue : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send message");

      await showSuccess("Message sent", data.message);
      setTitle("");
      setMessage("");
      setTargetId("");
      setTargetValue("");
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
              placeholder="Exam reminder, deadline, etc."
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
              placeholder="Write your message to students…"
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
                value={specificValue}
                onChange={(e) => handleSpecificChange(e.target.value)}
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
                  No {specificLabel.toLowerCase()} options available. Add students or departments first.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              This message will be delivered to every active student account.
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
            <thead className="bg-slate-50">
              <tr>
                {["Title", "Audience", "Recipients", "Sent", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingMessages ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Loading messages…
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No messages sent yet.
                  </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-medium">{m.title}</td>
                    <td className="px-3 py-2">{m.audience}</td>
                    <td className="px-3 py-2 text-slate-600">{m.recipientCount}</td>
                    <td className="px-3 py-2 text-slate-500">{m.sentAt}</td>
                    <td className="px-3 py-2">
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
