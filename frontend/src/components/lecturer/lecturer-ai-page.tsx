"use client";

import { TransitAiPanel } from "@/components/ai/transit-ai-panel";

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
      <TransitAiPanel
        apiUrl="/api/lecturer/ai"
        title="Transit College AI for Lecturers"
        subtitle="Lesson planning • grading help • content drafting"
        suggestions={[
          "Draft a lecture outline for my next class.",
          "Create 5 quiz questions with answers.",
          "Explain a concept at beginner and advanced levels.",
          "Suggest assignment rubric criteria.",
        ]}
      />
    </div>
  );
}
