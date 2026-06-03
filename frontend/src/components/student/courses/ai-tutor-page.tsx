"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PageHeader } from "@/components/student/courses/ui/course-ui";

export function AiTutorPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    const q = question.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/student/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      setMessages((m) => [...m, { role: "ai", text: json.answer ?? json.error ?? "No response." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Tutor"
        subtitle="Patient, step-by-step help for any course topic"
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80"
      >
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#0B3D91]/5 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC107] text-[#0B3D91]">
            AI
          </div>
          <div>
            <p className="font-semibold text-slate-900">Transit College S/L AI Tutor</p>
            <p className="text-sm text-slate-500">Ask about formulas, concepts, or assignments</p>
          </div>
        </div>
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">Try: &quot;What is reflection of light?&quot;</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user" ? "ml-12 bg-[#0B3D91] text-white" : "mr-12 bg-white ring-1 ring-slate-200"
                }`}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask your question..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
          />
          <button
            type="button"
            onClick={ask}
            disabled={loading}
            className="rounded-xl bg-[#0B3D91] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
