"use client";

export function LecturerSubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            "rounded-lg px-4 py-2 text-sm font-semibold transition",
            active === tab.id
              ? "bg-[#0B3D91] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
