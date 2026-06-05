/** Deterministic accent colors for material cards when no cover image is found. */
export type MaterialCoverPalette = {
  gradient: string;
  spine: string;
  label: string;
};

const PALETTES: MaterialCoverPalette[] = [
  { gradient: "from-[#0B3D91] via-[#1565c0] to-[#072d6b]", spine: "bg-[#FFC107]", label: "text-blue-50" },
  { gradient: "from-violet-600 via-purple-600 to-indigo-900", spine: "bg-fuchsia-300", label: "text-violet-50" },
  { gradient: "from-teal-600 via-emerald-600 to-cyan-900", spine: "bg-lime-300", label: "text-teal-50" },
  { gradient: "from-amber-500 via-orange-500 to-rose-700", spine: "bg-yellow-200", label: "text-amber-50" },
  { gradient: "from-rose-600 via-pink-600 to-red-900", spine: "bg-rose-200", label: "text-rose-50" },
  { gradient: "from-slate-700 via-slate-800 to-slate-950", spine: "bg-sky-300", label: "text-slate-100" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getMaterialCoverPalette(seed: string): MaterialCoverPalette {
  return PALETTES[hashSeed(seed) % PALETTES.length];
}
