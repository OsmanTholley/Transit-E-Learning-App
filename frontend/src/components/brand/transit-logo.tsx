import Image from "next/image";

const LOGO_SRC = "/images/TCSL%20Logo.png";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showText?: boolean;
  subtitle?: string;
};

const sizes = {
  sm: { box: "h-9 w-9", img: 36, title: "text-[10px]", sub: "text-[9px]" },
  md: { box: "h-11 w-11", img: 44, title: "text-xs", sub: "text-[10px]" },
  lg: { box: "h-14 w-14", img: 56, title: "text-sm", sub: "text-xs" },
};

export function TransitLogo({
  size = "md",
  variant = "light",
  showText = true,
  subtitle = "E-Learning",
}: Props) {
  const s = sizes[size];
  const textMain = variant === "light" ? "text-white" : "text-[#0B3D91]";
  const textSub = variant === "light" ? "text-[#FFC107]" : "text-slate-500";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.box} relative shrink-0 overflow-hidden rounded-xl bg-white shadow-lg shadow-[#0B3D91]/20 ring-2 ring-[#FFC107]/50`}
      >
        <Image
          src={LOGO_SRC}
          alt="Transit College S/L"
          width={s.img}
          height={s.img}
          className="h-full w-full object-contain p-0.5"
          priority
        />
      </div>
      {showText ? (
        <div className="min-w-0 leading-tight">
          <p className={`${s.title} font-bold tracking-tight ${textMain}`}>Transit College S/L</p>
          <p className={`${s.sub} font-semibold uppercase tracking-[0.14em] ${textSub}`}>
            {subtitle}
          </p>
        </div>
      ) : null}
    </div>
  );
}
