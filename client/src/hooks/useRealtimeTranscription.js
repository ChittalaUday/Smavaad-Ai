/**
 * useRealtimeTranscription — Captures audio from localStream via MediaRecorder,
 * sends chunks over WebSocket to the AI transcription service, and returns
 * transcribed text in real-time.
 *
 * Starts when callState is ACTIVE, stops when it leaves ACTIVE.
 */

import { useRef, useEffect, useCallback } from "react";
import { CALL_STATES } from "./useCallStateManager";

const AI_SERVICE_WS_URL =
  import.meta.env.VITE_AI_SERVICE_WS_URL ||
  "ws://127.0.0.1:8000/api/ws/transcribe-stream";

export const useRealtimeTranscription = ({
  localStream,
  callState,
  onTranscript,
}) => {
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const isActiveRef = useRef(false);

  /**
   * Start capturing audio and sending to WebSocket.
   */
  const startTranscription = useCallback(() => {
    if (!localStream) {
      console.warn("[RealtimeTranscription] No localStream available");
      return;
    }

    // Check if audio tracks exist and are enabled
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn("[RealtimeTranscription] No audio tracks in stream");
      return;
    }

    try {
      // Create audio-only stream for recording
      const audioStream = new MediaStream(audioTracks);

      // Connect WebSocket
      const ws = new WebSocket(AI_SERVICE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[RealtimeTranscription] WebSocket connected");
        isActiveRef.current = true;

        // Start MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(audioStream, {
          mimeType,
          audioBitsPerSecond: 16000,
        });
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (
            event.data.size > 0 &&
            ws.readyState === WebSocket.OPEN &&
            isActiveRef.current
          ) {
            ws.send(event.data);
          }
        };

        // Capture audio in 1-second chunks
        recorder.start(1000);
        console.log("[RealtimeTranscription] MediaRecorder started");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "transcript" && data.text) {
            onTranscript(data.text);
          } else if (data.type === "error") {
            console.error("[RealtimeTranscription] Server error:", data.error);
          }
        } catch (e) {
          console.error("[RealtimeTranscription] Parse error:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[RealtimeTranscription] WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("[RealtimeTranscription] WebSocket closed");
        isActiveRef.current = false;
      };
    } catch (error) {
      console.error("[RealtimeTranscription] Failed to start:", error);
    }
  }, [localStream, onTranscript]);

  /**
   * Stop capturing audio and close WebSocket.
   */
  const stopTranscription = useCallback(() => {
    isActiveRef.current = false;

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch (e) {
        // Recorder may already be stopped
      }
      recorderRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    console.log("[RealtimeTranscription] Stopped");
  }, []);

  // Auto-start/stop based on callState
  // Start as soon as INITIALIZED (don't wait for ACTIVE, which requires a remote peer)
  useEffect(() => {
    if (
      callState === CALL_STATES.ACTIVE ||
      callState === CALL_STATES.INITIALIZED
    ) {
      startTranscription();
    } else {
      stopTranscription();
    }

    return () => {
      stopTranscription();
    };
  }, [callState, startTranscription, stopTranscription]);

  return {
    isTranscribing: isActiveRef.current,
    startTranscription,
    stopTranscription,
  };
};
