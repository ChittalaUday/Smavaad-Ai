import React from "react";
import { useMeeting } from "../../context/MeetingContext";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";
import LiveTranscript from "./LiveTranscript";
import CallWrapUp from "./CallWrapUp";
import { CALL_STATES } from "../../hooks/useCallStateManager";

/**
 * Full-screen overlay that renders the active video call
 * on top of whatever page the user is on (always the chat).
 *
 * Now integrates:
 *  - LiveTranscript panel (toggleable during ACTIVE state)
 *  - CallWrapUp card (shown when call ENDED)
 *  - Duration display header
 */
const CallOverlay = () => {
    const {
        activeMeeting,
        leaveMeeting,
        callState,
        transcript,
        extractedIntents,
        callSummary,
        formattedDuration,
        greeting,
        showTranscript,
        toggleTranscript,
        handleDismissWrapUp,
        isSummarizing,
    } = useMeeting();

    console.log("CallOverlay render — activeMeeting:", activeMeeting, "callState:", callState);

    if (!activeMeeting) return null;

    // Show CallWrapUp when call has ENDED
    if (callState === CALL_STATES.ENDED) {
        return (
            <CallWrapUp
                formattedDuration={formattedDuration}
                callSummary={callSummary}
                extractedIntents={extractedIntents}
                transcript={transcript}
                onDismiss={handleDismissWrapUp}
                isLoading={isSummarizing}
            />
        );
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: "#111827",
                color: "white",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div
                style={{
                    backgroundColor: "#1f2937",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#9ca3af" }}>
                        Call: {activeMeeting.meetingId}
                    </span>
                    {/* Call Duration */}
                    <span
                        style={{
                            fontSize: "13px",
                            color: "#10b981",
                            fontFamily: "monospace",
                            backgroundColor: "#064e3b",
                            padding: "2px 8px",
                            borderRadius: "4px",
                        }}
                    >
                        {formattedDuration}
                    </span>
                    {/* Call State Badge */}
                    <span
                        style={{
                            fontSize: "11px",
                            color:
                                callState === CALL_STATES.ACTIVE
                                    ? "#34d399"
                                    : "#fbbf24",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {callState === CALL_STATES.INITIALIZED
                            ? "Connecting..."
                            : callState}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Transcript Toggle */}
                    <button
                        onClick={toggleTranscript}
                        style={{
                            color: showTranscript ? "#818cf8" : "#9ca3af",
                            background: showTranscript
                                ? "rgba(99, 102, 241, 0.1)"
                                : "none",
                            border: "1px solid",
                            borderColor: showTranscript ? "#6366f1" : "transparent",
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            transition: "all 0.2s",
                        }}
                    >
                        📝 Transcript
                    </button>
                    <button
                        onClick={leaveMeeting}
                        style={{
                            color: "#f87171",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 500,
                        }}
                    >
                        ✕ End Call
                    </button>
                </div>
            </div>

            {/* Greeting Banner (INITIALIZED state) */}
            {greeting && (
                <div
                    style={{
                        backgroundColor: "#1e3a5f",
                        padding: "8px 16px",
                        fontSize: "13px",
                        color: "#93c5fd",
                        textAlign: "center",
                        borderBottom: "1px solid #1e40af",
                    }}
                >
                    {greeting}
                </div>
            )}

            {/* Video Area */}
            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                <VideoGrid />
                {/* Live Transcript Panel */}
                <LiveTranscript
                    transcript={transcript}
                    extractedIntents={extractedIntents}
                    isOpen={showTranscript}
                    onClose={toggleTranscript}
                />
            </div>

            {/* Controls */}
            <Controls />
        </div>
    );
};

export default CallOverlay;
