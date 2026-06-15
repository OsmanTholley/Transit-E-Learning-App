import { useEffect, useRef } from "react";

/** Defer work so state updates run outside the synchronous effect body. */
export function scheduleEffectWork(work: () => void | Promise<void>): void {
  queueMicrotask(() => {
    void work();
  });
}

/** Keep a ref aligned with the latest value without updating it during render. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
