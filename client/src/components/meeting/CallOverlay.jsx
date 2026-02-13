import React from "react";
import { useMeeting } from "../../context/MeetingContext";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";

/**
 * Full-screen overlay that renders the active video call
 * on top of whatever page the user is on (always the chat).
 */
const CallOverlay = () => {
    const { activeMeeting, leaveMeeting } = useMeeting();

    console.log("CallOverlay render — activeMeeting:", activeMeeting);

    if (!activeMeeting) return null;

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
                <span style={{ fontSize: "14px", color: "#9ca3af" }}>
                    Call: {activeMeeting.meetingId}
                </span>
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

            {/* Video Area */}
            <div style={{ flex: 1, overflow: "hidden" }}>
                <VideoGrid />
            </div>

            {/* Controls */}
            <Controls />
        </div>
    );
};

export default CallOverlay;
