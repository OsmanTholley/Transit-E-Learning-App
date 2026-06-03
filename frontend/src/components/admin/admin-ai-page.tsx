"use client";

import { TransitAiPanel } from "@/components/ai/transit-ai-panel";

export function AdminAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-700">Administration</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Summarize reports, draft notices, and explore platform insights with local AI models.
        </p>
      </div>
      <TransitAiPanel
        apiUrl="/api/admin/ai"
        title="Transit College S/L AI for Administrators"
        subtitle="Reports • announcements • operational insights"
        suggestions={[
          "Summarize key metrics I should review today.",
          "Draft a student announcement about exam schedules.",
          "Suggest onboarding checklist for new lecturers.",
          "Explain enrollment trends in plain language.",
        ]}
      />
    </div>
  );
}
