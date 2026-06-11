"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-indicator";
import { PaymentLockScreen } from "@/components/finance/payment-lock-screen";
import { useSocket } from "@/hooks/use-socket";
import { requestApi } from "@/lib/fetch-api";
import { SOCKET_EVENTS, userRoom } from "@/lib/socket-events";
import { useStudentSession } from "@/contexts/student-session-context";
import {
  FEE_LOCK_MESSAGES,
  feeContextForPath,
  isFeeProtectedStudentPath,
  type FeeLockPayload,
} from "@/lib/student-fee-guard-shared";

type EligibilityResponse = {
  isRestricted: boolean;
  lock: FeeLockPayload | null;
};

export function StudentFeeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { data: session } = useStudentSession();
  const { subscribe, joinRooms, leaveRooms } = useSocket();
  const protectedPath = isFeeProtectedStudentPath(pathname);
  const [loading, setLoading] = useState(protectedPath);
  const [restricted, setRestricted] = useState(false);
  const [lock, setLock] = useState<FeeLockPayload | null>(null);

  const checkEligibility = useCallback(async () => {
    if (!protectedPath) {
      setLoading(false);
      setRestricted(false);
      setLock(null);
      return;
    }

    setLoading(true);
    const result = await requestApi<EligibilityResponse>("/api/student/fee-eligibility", {
      silent: true,
    });
    setLoading(false);

    if (result.ok) {
      setRestricted(result.data.isRestricted);
      setLock(result.data.lock);
    }
  }, [protectedPath]);

  useEffect(() => {
    void checkEligibility();
  }, [checkEligibility, pathname]);

  useEffect(() => {
    const userId = session?.profile?.userId;
    if (!userId) return undefined;
    const room = userRoom(userId);
    joinRooms([room]);
    return () => leaveRooms([room]);
  }, [session?.profile?.userId, joinRooms, leaveRooms]);

  useEffect(() => {
    const onPaymentRecorded = () => void checkEligibility();
    window.addEventListener("transit:fee-updated", onPaymentRecorded);
    const unsubscribeSocket = subscribe(SOCKET_EVENTS.FEE_UPDATED, () => {
      void checkEligibility();
      window.dispatchEvent(new Event("transit:fee-updated"));
    });

    return () => {
      window.removeEventListener("transit:fee-updated", onPaymentRecorded);
      unsubscribeSocket?.();
    };
  }, [checkEligibility, subscribe]);

  if (!protectedPath) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
        <LoadingSpinner />
        <p className="text-sm font-medium text-slate-500">Checking payment status…</p>
      </div>
    );
  }

  if (restricted && lock) {
    const context = feeContextForPath(pathname);
    return <PaymentLockScreen lock={lock} message={FEE_LOCK_MESSAGES[context]} />;
  }

  return <>{children}</>;
}
