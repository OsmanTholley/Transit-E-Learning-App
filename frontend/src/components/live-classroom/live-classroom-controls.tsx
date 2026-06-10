"use client";

import type { ReactNode } from "react";

type ControlProps = {
  micOn: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  role: "student" | "lecturer";
  sidebarOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreen: () => void;
  onToggleHand: () => void;
  onToggleSidebar: () => void;
  onLeave: () => void;
  onEndClass?: () => void;
  onStartClass?: () => void;
  waitingForStudents?: boolean;
};

function ControlButton({
  label,
  active,
  highlight,
  danger,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  highlight?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-full transition sm:h-11 sm:w-11",
        danger
          ? "bg-[#C4314B] hover:bg-[#a82840]"
          : highlight
            ? "bg-[#0B3D91] hover:bg-[#0a3580]"
            : active
              ? "bg-white/25 hover:bg-white/35"
              : "bg-white/10 hover:bg-white/20",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function LiveClassroomControls({
  micOn,
  cameraOn,
  screenSharing,
  handRaised,
  role,
  sidebarOpen,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onToggleHand,
  onToggleSidebar,
  onLeave,
  onEndClass,
  onStartClass,
  waitingForStudents,
}: ControlProps) {
  const isLecturer = role === "lecturer";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-4">
      <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-[#252423] px-3 py-2 shadow-2xl ring-1 ring-white/10 sm:gap-2 sm:px-4 sm:py-2.5">
        <ControlButton label={micOn ? "Mute microphone" : "Unmute microphone"} active={micOn} onClick={onToggleMic}>
          {micOn ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17 1.25 1.25A5 5 0 0 0 17 11h-2v.17zM12 3a3 3 0 0 0-3 3v3.17l3 3V5a1 1 0 0 1 2 0v6.17l1.59 1.59.41-.41V8a3 3 0 0 0-3-3zM4.27 3 3 4.27 7.73 9H5v2a7 7 0 0 0 6 6.92V21h2v-3.08c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            </svg>
          )}
        </ControlButton>

        <ControlButton label={cameraOn ? "Stop camera" : "Start camera"} active={cameraOn} onClick={onToggleCamera}>
          {cameraOn ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M17 10.5V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M21 6.5l-4 4V7a2 2 0 0 0-2-2H9.82L21 17.18V6.5zM3.27 2 2 3.27 4.73 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8.73l4.73 4.73L21 18.73 3.27 2z" />
            </svg>
          )}
        </ControlButton>

        {isLecturer ? (
          <ControlButton
            label={screenSharing ? "Stop sharing screen" : "Share screen"}
            active={screenSharing}
            highlight={screenSharing}
            onClick={onToggleScreen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
            </svg>
          </ControlButton>
        ) : null}

        {!isLecturer ? (
          <ControlButton
            label={handRaised ? "Lower hand" : "Raise hand"}
            active={handRaised}
            onClick={onToggleHand}
          >
            <span className="text-base">✋</span>
          </ControlButton>
        ) : null}

        <ControlButton
          label={sidebarOpen ? "Hide panel" : "Show chat & people"}
          active={sidebarOpen}
          onClick={onToggleSidebar}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M4 4h16v16H4V4zm2 2v12h5V6H6zm7 0v12h5V6h-5z" />
          </svg>
        </ControlButton>

        {isLecturer && waitingForStudents && onStartClass ? (
          <button
            type="button"
            onClick={onStartClass}
            className="rounded-full bg-[#FFC107] px-4 py-2 text-xs font-semibold text-[#0B3D91] hover:bg-[#e6ad00] sm:text-sm"
          >
            Start for students
          </button>
        ) : null}

        <div className="mx-0.5 hidden h-8 w-px bg-white/20 sm:block" />

        {isLecturer && onEndClass ? (
          <ControlButton label="End class for everyone" danger onClick={onEndClass}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M6 6h12v12H6V6zm2 2v8h8V8H8z" />
            </svg>
          </ControlButton>
        ) : null}

        <ControlButton label="Leave class" danger onClick={onLeave}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M12 9c-1.6 0-3 .5-4.2 1.4l1.4 1.4A5.9 5.9 0 0 1 12 11c3.3 0 6 2.7 6 6v1h2v-1c0-4.4-3.6-8-8-8zM3.3 2.5 2 3.8l3.5 3.5A10 10 0 0 0 2 12v1h2v-1a8 8 0 0 1 2.1-5.4l1.5 1.5A5.9 5.9 0 0 0 6 12v1h2v-1c0-1 .3-1.9.8-2.7l4.2 4.2V21h2v-5.6l4.9 4.9 1.3-1.3L3.3 2.5z" />
          </svg>
        </ControlButton>
      </div>
    </div>
  );
}
