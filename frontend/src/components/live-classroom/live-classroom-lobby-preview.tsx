"use client";

import { useEffect, useRef, useState } from "react";

type LiveClassroomLobbyPreviewProps = {
  micOn: boolean;
  cameraOn: boolean;
  onMicChange: (on: boolean) => void;
  onCameraChange: (on: boolean) => void;
};

export function LiveClassroomLobbyPreview({
  micOn,
  cameraOn,
  onMicChange,
  onCameraChange,
}: LiveClassroomLobbyPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = micOn;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = cameraOn;
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        let lastTick = 0;
        const tick = (now: number) => {
          if (!analyserRef.current) return;
          if (now - lastTick >= 100) {
            analyserRef.current.getByteFrequencyData(data);
            const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            lastTick = now;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        setMediaError(null);
      } catch {
        if (!cancelled) {
          setMediaError("Camera or microphone access was denied. You can still join, but enable devices in your browser settings.");
        }
      }
    }

    void startPreview();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      analyserRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial preview only
  }, []);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = micOn;
    });
  }, [micOn]);

  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = cameraOn;
    });
  }, [cameraOn]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#1b1a19] ring-1 ring-white/10">
        {cameraOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover mirror" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/50">Camera off</div>
        )}
        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="shrink-0">Voice</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#FFC107] transition-all duration-75"
                style={{ width: micOn ? `${Math.max(4, audioLevel)}%` : "0%" }}
              />
            </div>
            <span className="shrink-0 tabular-nums">{micOn ? `${audioLevel}%` : "Muted"}</span>
          </div>
        </div>
      </div>

      {mediaError ? <p className="text-xs text-amber-300">{mediaError}</p> : null}

      <div className="space-y-2 rounded-lg bg-[#1b1a19] p-4 text-sm">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={micOn}
            onChange={(e) => onMicChange(e.target.checked)}
            className="h-4 w-4 rounded accent-[#FFC107]"
          />
          <span>Microphone on — voice level is detected while you wait</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={cameraOn}
            onChange={(e) => onCameraChange(e.target.checked)}
            className="h-4 w-4 rounded accent-[#FFC107]"
          />
          <span>Camera on</span>
        </label>
      </div>
    </div>
  );
}
