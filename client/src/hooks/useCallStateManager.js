/**
 * useCallStateManager — Core state machine hook for managing call lifecycle.
 *
 * States: IDLE → INITIALIZED → ACTIVE → ENDED
 *
 * - IDLE: No call active
 * - INITIALIZED: Connection established, greeting shown, session ready
 * - ACTIVE: Real-time transcription, intent extraction, context buffer
 * - ENDED: Post-processing — summarization, action items, wrap-up card
 */

import { useState, useRef, useCallback, useEffect } from "react";

// Call states — strict lifecycle, no overlap
export const CALL_STATES = {
  IDLE: "IDLE",
  INITIALIZED: "INITIALIZED",
  ACTIVE: "ACTIVE",
  ENDED: "ENDED",
};

export const useCallStateManager = () => {
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [sessionId, setSessionId] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [extractedIntents, setExtractedIntents] = useState({
    action_items: [],
    deadlines: [],
    decisions: [],
  });
  const [callSummary, setCallSummary] = useState(null);
  const [greeting, setGreeting] = useState("");

  // Refs for timer and state
  const timerRef = useRef(null);
  const stateRef = useRef(CALL_STATES.IDLE);
  const transcriptRef = useRef("");
  const contextBufferRef = useRef([]); // Rolling 3-minute context entries

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = callState;
  }, [callState]);

  // Keep transcriptRef in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Call duration timer
  useEffect(() => {
    if (
      callState === CALL_STATES.ACTIVE ||
      callState === CALL_STATES.INITIALIZED
    ) {
      timerRef.current = setInterval(() => {
        if (callStartTime) {
          setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState, callStartTime]);

  /**
   * IDLE → INITIALIZED
   * Called when joinMeeting() completes successfully.
   */
  const initializeCall = useCallback(() => {
    if (stateRef.current !== CALL_STATES.IDLE) {
      console.warn(
        "initializeCall: Not in IDLE state, current:",
        stateRef.current,
      );
      return;
    }

    const newSessionId = crypto.randomUUID();
    const now = Date.now();

    setSessionId(newSessionId);
    setCallStartTime(now);
    setCallDuration(0);
    setTranscript("");
    setExtractedIntents({ action_items: [], deadlines: [], decisions: [] });
    setCallSummary(null);
    setGreeting("Connection established. I am ready to assist with this call.");
    setCallState(CALL_STATES.INITIALIZED);

    console.log(
      `[CallStateManager] IDLE → INITIALIZED | Session: ${newSessionId}`,
    );
  }, []);

  /**
   * INITIALIZED → ACTIVE
   * Called when the first peer connects or first audio is received.
   */
  const activateCall = useCallback(() => {
    if (stateRef.current !== CALL_STATES.INITIALIZED) {
      console.warn(
        "activateCall: Not in INITIALIZED state, current:",
        stateRef.current,
      );
      return;
    }

    setGreeting(""); // Clear greeting
    setCallState(CALL_STATES.ACTIVE);
    console.log("[CallStateManager] INITIALIZED → ACTIVE");
  }, []);

  /**
   * ACTIVE → ENDED
   * Called when leaveMeeting() is triggered (hang up / connection drop).
   * Post-processing begins here.
   */
  const endCall = useCallback(() => {
    if (
      stateRef.current !== CALL_STATES.ACTIVE &&
      stateRef.current !== CALL_STATES.INITIALIZED
    ) {
      console.warn(
        "endCall: Not in ACTIVE/INITIALIZED state, current:",
        stateRef.current,
      );
      return;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCallState(CALL_STATES.ENDED);
    console.log("[CallStateManager] ACTIVE → ENDED | Post-processing begins");
  }, []);

  /**
   * ENDED → IDLE
   * Called when user dismisses the wrap-up card.
   */
  const dismissWrapUp = useCallback(() => {
    if (stateRef.current !== CALL_STATES.ENDED) {
      console.warn(
        "dismissWrapUp: Not in ENDED state, current:",
        stateRef.current,
      );
      return;
    }

    setSessionId(null);
    setCallStartTime(null);
    setCallDuration(0);
    setTranscript("");
    setExtractedIntents({ action_items: [], deadlines: [], decisions: [] });
    setCallSummary(null);
    setGreeting("");
    contextBufferRef.current = [];
    setCallState(CALL_STATES.IDLE);
    console.log("[CallStateManager] ENDED → IDLE");
  }, []);

  /**
   * Append new transcript text (called by real-time transcription hook).
   * Also maintains the rolling 3-minute context buffer.
   */
  const appendTranscript = useCallback((text) => {
    if (
      stateRef.current !== CALL_STATES.ACTIVE &&
      stateRef.current !== CALL_STATES.INITIALIZED
    )
      return;

    const now = Date.now();

    setTranscript((prev) => {
      const updated = prev + (prev ? " " : "") + text;
      return updated;
    });

    // Add to rolling context buffer with timestamp
    contextBufferRef.current.push({ text, timestamp: now });

    // Remove entries older than 3 minutes
    const threeMinAgo = now - 3 * 60 * 1000;
    contextBufferRef.current = contextBufferRef.current.filter(
      (entry) => entry.timestamp > threeMinAgo,
    );
  }, []);

  /**
   * Get the last 3 minutes of conversation text.
   */
  const getRecentContext = useCallback(() => {
    const now = Date.now();
    const threeMinAgo = now - 3 * 60 * 1000;
    const recentEntries = contextBufferRef.current.filter(
      (entry) => entry.timestamp > threeMinAgo,
    );
    return recentEntries.map((e) => e.text).join(" ");
  }, []);

  /**
   * Update extracted intents (called periodically during ACTIVE state).
   */
  const updateIntents = useCallback((intents) => {
    if (stateRef.current !== CALL_STATES.ACTIVE) return;
    setExtractedIntents((prev) => ({
      action_items: [...prev.action_items, ...(intents.action_items || [])],
      deadlines: [...prev.deadlines, ...(intents.deadlines || [])],
      decisions: [...prev.decisions, ...(intents.decisions || [])],
    }));
  }, []);

  /**
   * Set the post-call summary (called during ENDED state).
   */
  const setPostCallSummary = useCallback((summary) => {
    if (stateRef.current !== CALL_STATES.ENDED) return;
    setCallSummary(summary);
  }, []);

  /**
   * Format call duration as MM:SS or HH:MM:SS.
   */
  const formattedDuration = (() => {
    const hrs = Math.floor(callDuration / 3600);
    const mins = Math.floor((callDuration % 3600) / 60);
    const secs = callDuration % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  })();

  return {
    // State
    callState,
    sessionId,
    callStartTime,
    callDuration,
    formattedDuration,
    transcript,
    extractedIntents,
    callSummary,
    greeting,

    // Transitions
    initializeCall,
    activateCall,
    endCall,
    dismissWrapUp,

    // Data management
    appendTranscript,
    getRecentContext,
    updateIntents,
    setPostCallSummary,
  };
};
