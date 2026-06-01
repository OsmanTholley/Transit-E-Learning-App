import { Suspense } from "react";
import { AiTutorHub } from "@/components/student/ai-tutor/ai-tutor-hub";

export default async function StudentAiTutorPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading AI Tutor…</p>}>
      <AiTutorHub segment={segment} />
    </Suspense>
  );
}
