"use client";

import { useCallback, useEffect, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";

type AttendanceDashboard = {
  session: { title: string | null; hostName: string; hostRole: string; status: string };
  summary: {
    totalRegistered: number;
    totalAttendees: number;
    totalAbsent: number;
    totalLate: number;
    attendancePercentage: number;
    currentOnline: number;
  };
  rows: Array<{
    studentName: string;
    studentIdCode: string;
    joinTime: string;
    exitTime: string | null;
    durationLabel: string;
    status: string;
    isOnline: boolean;
  }>;
};

type Props = {
  liveClassId: string;
  active?: boolean;
};

export function LiveClassAttendancePanel({ liveClassId, active = true }: Props) {
  const [data, setData] = useState<AttendanceDashboard | null>(null);

  const load = useCallback(async () => {
    const result = await requestApi<AttendanceDashboard>(`/api/live-classes/${liveClassId}/attendance`, {
      silent: true,
    });
    if (result.ok) setData(result.data);
  }, [liveClassId]);

  useEffect(() => {
    if (!active) return;
    scheduleEffectWork(() => load());
    const timer = window.setInterval(() => void load(), 12_000);
    return () => window.clearInterval(timer);
  }, [active, load]);

  if (!data) {
    return <p className="text-xs text-white/40">Loading attendance…</p>;
  }

  return (
    <div className="space-y-3 text-sm text-white/90">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/50">Registered</p>
          <p className="text-lg font-semibold">{data.summary.totalRegistered}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/50">Online</p>
          <p className="text-lg font-semibold text-emerald-400">{data.summary.currentOnline}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/50">Attended</p>
          <p className="text-lg font-semibold">{data.summary.totalAttendees}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/50">Attendance</p>
          <p className="text-lg font-semibold">{data.summary.attendancePercentage}%</p>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`/api/live-classes/${liveClassId}/attendance?export=pdf`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-[#FFC107] px-2 py-1 text-[10px] font-semibold text-[#0B3D91]"
        >
          Export PDF
        </a>
        <a
          href={`/api/live-classes/${liveClassId}/attendance?export=csv`}
          className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/80"
        >
          Export CSV
        </a>
      </div>

      <div className="space-y-1.5">
        {data.rows.length === 0 ? (
          <p className="text-xs text-white/40">No attendance records yet.</p>
        ) : (
          data.rows.map((row) => (
            <div key={`${row.studentIdCode}-${row.joinTime}`} className="rounded-lg bg-white/5 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white">{row.studentName}</p>
                <span className={row.isOnline ? "text-emerald-400" : "text-white/40"}>
                  {row.isOnline ? "Online" : row.status}
                </span>
              </div>
              <p className="text-white/50">
                {row.studentIdCode} · {row.durationLabel}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
