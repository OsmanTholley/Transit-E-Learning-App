"use client";

import { useCallback, useRef, useState } from "react";

type UseVoiceRecorderOptions = {
  onRecorded: (audioDataUrl: string) => void | Promise<void>;
  onError?: () => void;
};

export function useVoiceRecorder({ onRecorded, onError }: UseVoiceRecorderOptions) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          void onRecorded(dataUrl);
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      onError?.();
    }
  }, [onError, onRecorded]);

  const toggleRecording = useCallback(() => {
    if (recording) {
      stopRecording();
      return;
    }
    void startRecording();
  }, [recording, startRecording, stopRecording]);

  return { recording, startRecording, stopRecording, toggleRecording };
}
