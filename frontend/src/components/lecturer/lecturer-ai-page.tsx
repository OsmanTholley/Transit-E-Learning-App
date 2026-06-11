"use client";

import { TransitAiAssistant } from "@/components/ai/transit-ai-assistant";

export function LecturerAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#0B3D91]">Lecturer tools</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Draft explanations, quiz ideas, and feedback with AI assistance.
        </p>
      </div>
      <TransitAiAssistant
        roleLabel="Lecturer"
        feature="teaching assistant"
        suggestions={[
          "Generate a 10-question quiz with answers.",
          "Create a midterm exam outline for my course.",
          "Draft a lesson plan for next week.",
          "Summarize today's lecture into student notes.",
          "Create an assignment with rubric criteria.",
        ]}
      />
    </div>
  );
}
