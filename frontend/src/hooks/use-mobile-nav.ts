"use client";

import { useState } from "react";

export function useMobileNav(pathname: string) {
  const [nav, setNav] = useState({ open: false, pathname });

  if (nav.pathname !== pathname) {
    setNav({ open: false, pathname });
  }

  return {
    mobileNavOpen: nav.open,
    openMobileNav: () => setNav((current) => ({ ...current, open: true })),
    closeMobileNav: () => setNav((current) => ({ ...current, open: false })),
  };
}
