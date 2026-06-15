"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { scheduleEffectWork } from "@/lib/react-effect-utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    scheduleEffectWork(() => {
      setVisible(true);
      setProgress(15);
    });

    const advance = setTimeout(() => setProgress(55), 80);
    const nearDone = setTimeout(() => setProgress(88), 280);
    const finish = setTimeout(() => {
      setProgress(100);
      const hide = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 220);
      return () => clearTimeout(hide);
    }, 480);

    return () => {
      clearTimeout(advance);
      clearTimeout(nearDone);
      clearTimeout(finish);
    };
  }, [pathname, searchParams]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden"
      aria-hidden
    >
      <div
        className="navigation-progress-bar h-full transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}
