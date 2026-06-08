"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VideoPlayState = "playing" | "paused" | "ended";

type QualityOption = "Auto" | "1080p" | "720p" | "480p";

type Props = {
  src: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  onPlayStateChange?: (state: VideoPlayState) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
};

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITIES: QualityOption[] = ["Auto", "1080p", "720p", "480p"];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function YoutubeStyleVideoPlayer({
  src,
  title,
  poster,
  autoPlay = false,
  className = "",
  onPlayStateChange,
  onTimeUpdate,
}: Props) {
  const isYoutube = src.includes("youtube.com") || src.includes("youtu.be") || src.includes("youtube/embed");
  
  const ytId = useMemo(() => {
    if (!isYoutube) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = src.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, [src, isYoutube]);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<QualityOption>("Auto");
  const [pipActive, setPipActive] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"main" | "speed" | "quality">("main");
  const [seeking, setSeeking] = useState(false);

  const notifyState = useCallback(
    (state: VideoPlayState) => {
      onPlayStateChange?.(state);
    },
    [onPlayStateChange]
  );

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (playing && !settingsOpen) setShowControls(false);
    }, 2800);
  }, [playing, settingsOpen]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    function onFsChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    function onPipChange() {
      setPipActive(Boolean(document.pictureInPictureElement));
    }
    document.addEventListener("enterpictureinpicture", onPipChange);
    document.addEventListener("leavepictureinpicture", onPipChange);
    return () => {
      document.removeEventListener("enterpictureinpicture", onPipChange);
      document.removeEventListener("leavepictureinpicture", onPipChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  async function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused || el.ended) {
      if (el.ended) {
        el.currentTime = 0;
        setEnded(false);
      }
      await el.play();
      setPlaying(true);
      setShowControls(true);
      notifyState("playing");
      scheduleHideControls();
    } else {
      el.pause();
      setPlaying(false);
      setShowControls(true);
      notifyState("paused");
    }
  }

  async function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await container.requestFullscreen();
    }
  }

  async function togglePip() {
    const el = videoRef.current;
    if (!el) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await el.requestPictureInPicture();
    }
    setSettingsOpen(false);
  }

  function handleSeek(value: number) {
    const el = videoRef.current;
    if (!el || !duration) return;
    const next = (value / 100) * duration;
    el.currentTime = next;
    setCurrentTime(next);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isYoutube && ytId) {
    return (
      <div
        className={[
          "yt-player group relative overflow-hidden bg-black",
          fullscreen ? "fixed inset-0 z-[100] rounded-none" : "rounded-xl sm:rounded-2xl",
          className,
        ].join(" ")}
      >
        <div className={fullscreen ? "flex h-full w-full items-center justify-center bg-black" : "relative aspect-video w-full"}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={[
        "yt-player group relative overflow-hidden bg-black",
        fullscreen ? "fixed inset-0 z-[100] rounded-none" : "rounded-xl sm:rounded-2xl",
        className,
      ].join(" ")}
      onMouseMove={() => {
        setShowControls(true);
        if (playing) scheduleHideControls();
      }}
      onTouchStart={() => setShowControls(true)}
    >
      <div className={fullscreen ? "flex h-full w-full items-center justify-center" : "relative aspect-video w-full"}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          className={fullscreen ? "max-h-full max-w-full" : "h-full w-full object-contain"}
          onClick={() => void togglePlay()}
          onPlay={() => {
            setPlaying(true);
            setEnded(false);
            notifyState("playing");
            scheduleHideControls();
          }}
          onPause={() => {
            setPlaying(false);
            notifyState("paused");
          }}
          onEnded={() => {
            setPlaying(false);
            setEnded(true);
            setShowControls(true);
            notifyState("ended");
          }}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration || 0);
          }}
          onTimeUpdate={(e) => {
            if (seeking) return;
            const t = e.currentTarget.currentTime;
            const d = e.currentTarget.duration || duration;
            setCurrentTime(t);
            onTimeUpdate?.(t, d);
          }}
        />

        {!playing && !ended ? (
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="absolute inset-0 grid place-items-center bg-black/20"
            aria-label={title ? `Play ${title}` : "Play video"}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 sm:h-8 sm:w-8" fill="currentColor">
                <path d="M8 5v14l11-7-11-7z" />
              </svg>
            </span>
          </button>
        ) : null}

        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pb-2 pt-10 transition-opacity sm:px-3 sm:pb-3",
            showControls || !playing || settingsOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <div className="pointer-events-auto space-y-2">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onChange={(e) => handleSeek(Number(e.target.value))}
              onMouseDown={() => setSeeking(true)}
              onMouseUp={() => setSeeking(false)}
              onTouchStart={() => setSeeking(true)}
              onTouchEnd={() => setSeeking(false)}
              className="yt-progress h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-red-600"
              aria-label="Seek"
            />

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="rounded-full p-2 text-white hover:bg-white/15"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor">
                    <path d="M8 5v14l11-7-11-7z" />
                  </svg>
                )}
              </button>

              <div className="hidden items-center gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="rounded-full p-2 text-white hover:bg-white/15"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M16.5 12A4.5 4.5 0 0 0 14 8.5v2.03a2.5 2.5 0 0 1 0 4.94V15a4.5 4.5 0 0 0 2.5-3zm2.5 0a7 7 0 0 0-12.5-4.33v2.11a5 5 0 0 1 7.07 7.07H16v-4.85zM4 9.27V15h3l3.5 3.5V5.27L7 9H4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setMuted(false);
                  }}
                  className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
                  aria-label="Volume"
                />
              </div>

              <span className="min-w-[4.5rem] text-[11px] font-medium text-white sm:text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen((o) => !o);
                    setSettingsTab("main");
                    setShowControls(true);
                  }}
                  className="rounded-full p-2 text-white hover:bg-white/15"
                  aria-label="Settings"
                  aria-expanded={settingsOpen}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor">
                    <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.03 7.03 0 0 0-1.7-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.38 2.65c-.62.24-1.21.56-1.7.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.49.42 1.08.74 1.7.98l.38 2.65A.5.5 0 0 0 10 22h4a.5.5 0 0 0 .49-.42l.38-2.65c.62-.24 1.21-.56 1.7-.98l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
                  </svg>
                </button>

                {settingsOpen ? (
                  <div className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-lg bg-black/95 text-sm text-white shadow-xl ring-1 ring-white/10">
                    {settingsTab === "main" ? (
                      <ul>
                        <li>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/10"
                            onClick={() => setSettingsTab("speed")}
                          >
                            <span>Playback speed</span>
                            <span className="text-white/70">{speed === 1 ? "Normal" : `${speed}x`}</span>
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/10"
                            onClick={() => setSettingsTab("quality")}
                          >
                            <span>Quality</span>
                            <span className="text-white/70">{quality}</span>
                          </button>
                        </li>
                        {document.pictureInPictureEnabled !== false ? (
                          <li>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/10"
                              onClick={() => void togglePip()}
                            >
                              <span>Picture-in-picture</span>
                              <span className="text-white/70">{pipActive ? "On" : "Off"}</span>
                            </button>
                          </li>
                        ) : null}
                      </ul>
                    ) : settingsTab === "speed" ? (
                      <div>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-2 text-left text-white/70 hover:bg-white/10"
                          onClick={() => setSettingsTab("main")}
                        >
                          ← Playback speed
                        </button>
                        <ul className="max-h-48 overflow-y-auto py-1">
                          {SPEEDS.map((s) => (
                            <li key={s}>
                              <button
                                type="button"
                                className={[
                                  "flex w-full px-4 py-2 hover:bg-white/10",
                                  speed === s ? "font-bold text-red-400" : "",
                                ].join(" ")}
                                onClick={() => {
                                  setSpeed(s);
                                  setSettingsTab("main");
                                }}
                              >
                                {s === 1 ? "Normal" : `${s}x`}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-2 text-left text-white/70 hover:bg-white/10"
                          onClick={() => setSettingsTab("main")}
                        >
                          ← Quality
                        </button>
                        <ul className="py-1">
                          {QUALITIES.map((q) => (
                            <li key={q}>
                              <button
                                type="button"
                                className={[
                                  "flex w-full px-4 py-2 hover:bg-white/10",
                                  quality === q ? "font-bold text-red-400" : "",
                                ].join(" ")}
                                onClick={() => {
                                  setQuality(q);
                                  setSettingsTab("main");
                                }}
                              >
                                {q}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="rounded-full p-2 text-white hover:bg-white/15"
                aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {fullscreen ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
