import { Suspense } from "react";
import { DiscussionsHub } from "@/components/student/discussions/discussions-hub";

export default async function StudentDiscussionsPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading discussions…</p>}>
      <DiscussionsHub segment={segment} />
    </Suspense>
  );
}
