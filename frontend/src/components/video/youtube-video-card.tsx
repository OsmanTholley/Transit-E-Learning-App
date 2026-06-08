"use client";

type Props = {
  title: string;
  subtitle?: string;
  duration?: string | null;
  onClick: () => void;
  active?: boolean;
};

export function YoutubeVideoCard({ title, subtitle, duration, onClick, active }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full text-left transition",
        active ? "ring-2 ring-red-600 rounded-xl" : "",
      ].join(" ")}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black" />
        <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor">
              <path d="M8 5v14l11-7-11-7z" />
            </svg>
          </span>
        </div>
        {duration ? (
          <span className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-white bg-black/80">
            {duration}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex gap-2 pr-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-xs font-bold text-white">
          {title.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#0B3D91]">
            {title}
          </p>
          {subtitle ? <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
    </button>
  );
}
