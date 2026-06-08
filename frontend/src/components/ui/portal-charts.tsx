"use client";

type ChartPoint = {
  label: string;
  value: number;
  color?: string;
};

const defaultBarColors = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#0ea5e9", "#6366f1"];

export function PortalBarChart({
  data,
  height = 220,
  valueSuffix = "",
}: {
  data: ChartPoint[];
  height?: number;
  valueSuffix?: string;
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 48;

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex h-full items-end gap-2 sm:gap-3" style={{ height: chartHeight }}>
        {data.map((point, index) => {
          const barHeight = Math.max(8, (point.value / max) * (chartHeight - 16));
          const color = point.color ?? defaultBarColors[index % defaultBarColors.length];

          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                {point.value}
                {valueSuffix}
              </span>
              <div
                className="w-full max-w-[3rem] rounded-t-lg transition-all duration-500"
                style={{ height: barHeight, backgroundColor: color }}
                title={`${point.label}: ${point.value}${valueSuffix}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2 sm:gap-3">
        {data.map((point) => (
          <p key={point.label} className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-slate-500 sm:text-xs">
            {point.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export function PortalDonutChart({
  data,
  size = 180,
}: {
  data: ChartPoint[];
  size?: number;
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No data yet.</p>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const segments = data.map((point, index) => {
    const pct = point.value / total;
    const dash = pct * circumference;
    const offset = data
      .slice(0, index)
      .reduce((sum, item) => sum + (item.value / total) * circumference, 0);
    return {
      ...point,
      dash,
      offset,
      color: point.color ?? defaultBarColors[index % defaultBarColors.length],
      pct: Math.round(pct * 1000) / 10,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2.5 sm:max-w-xs sm:flex-1">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate font-medium text-slate-700">{segment.label}</span>
            </div>
            <span className="shrink-0 text-slate-500">
              {segment.value} ({segment.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PortalLineTrend({
  data,
  height = 200,
}: {
  data: ChartPoint[];
  height?: number;
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const padding = 8;
  const innerHeight = height - 40;

  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = padding + innerHeight - (point.value / max) * innerHeight;
    return { ...point, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? padding} ${padding + innerHeight} L ${points[0]?.x ?? padding} ${padding + innerHeight} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke="#0d9488" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between gap-1">
        {data.map((point) => (
          <span key={point.label} className="flex-1 truncate text-center text-[10px] font-medium text-slate-500 sm:text-xs">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
