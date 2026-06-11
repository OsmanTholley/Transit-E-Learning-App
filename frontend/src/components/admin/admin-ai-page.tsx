"use client";

import { TransitAiAssistant } from "@/components/ai/transit-ai-assistant";

export function AdminAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-700">Administration</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Draft announcements, generate reports, create notices, and summarize platform data.
        </p>
      </div>
      <TransitAiAssistant
        roleLabel="Administrator"
        feature="admin operations"
        suggestions={[
          "Summarize key metrics I should review today.",
          "Draft a student announcement about exam schedules.",
          "Create a notice for overdue fee payments.",
          "Summarize enrollment and attendance trends.",
        ]}
      />
    </div>
  );
}
