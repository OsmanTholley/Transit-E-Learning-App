"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import { SectionContentView } from "@/components/section-content";
import type { SectionContent } from "@/types/app";

type Props = {
  section: string;
  fallbackTitle: string;
  fallbackSubtitle: string;
};

export function AdminSectionView({ section, fallbackTitle, fallbackSubtitle }: Props) {
  const { data, loading, error } = useApiLoad<{ content: SectionContent }>(
    `/api/admin/sections/${section}`,
    { errorTitle: "Could not load section" }
  );

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading from database…</p>;
  }

  if (error && !data) {
    return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  }

  const content = data?.content ?? {
    title: fallbackTitle,
    subtitle: fallbackSubtitle,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Administration</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{content.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{content.subtitle}</p>
      </div>
      <SectionContentView content={content} />
    </div>
  );
}
