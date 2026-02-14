import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMeeting } from "../../context/MeetingContext";
import CallOverlay from "../../components/meeting/CallOverlay";

const MeetingRoom = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const {
        joinMeeting,
        leaveMeeting,
        activeMeeting,
        callState
    } = useMeeting();

    const hasJoinedRef = useRef(false);

    useEffect(() => {
        if (meetingId) {
            joinMeeting(meetingId);
        }

        return () => {
            leaveMeeting();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetingId]);

    // Navigate away ONLY after wrap-up is dismissed (activeMeeting becomes null)
    useEffect(() => {
        if (activeMeeting) {
            hasJoinedRef.current = true;
        } else if (hasJoinedRef.current) {
            // Meeting ended and wrap-up dismissed
            navigate("/chat", { replace: true, state: { sidebar: "meeting" } });
        }
    }, [activeMeeting, navigate]);

    // Show loading while connecting
    if (!activeMeeting && !hasJoinedRef.current) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Connecting to Meeting Room...</p>
            </div>
        );
    }

    // Use the unified CallOverlay component
    // It handles VideoGrid, Controls, Chat, Participants, LiveTranscript, and CallWrapUp internally.
    return (
        <CallOverlay />
    );
};

export default MeetingRoom;
