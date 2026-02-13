import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMeeting } from "../../context/MeetingContext";
import VideoGrid from "../../components/meeting/VideoGrid";
import Controls from "../../components/meeting/Controls";
import Chat from "../../components/meeting/Chat"; // Meeting Chat
import ParticipantList from "../../components/meeting/ParticipantList";
import ChatsSection from "../../components/ChatsSection"; // Personal Chat
import { useChat } from "../../context/ChatContext";

const MeetingRoom = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { joinMeeting, leaveMeeting, activeMeeting } = useMeeting();
    const hasJoinedRef = useRef(false);

    // UI State
    // 'meeting-chat' | 'participants' | 'personal-chat' | null
    const [activeSidebar, setActiveSidebar] = useState(null);
    const { currentSelectedChat } = useChat();

    useEffect(() => {
        if (meetingId) {
            joinMeeting(meetingId);
        }

        return () => {
            leaveMeeting();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetingId]);

    // Navigate away when the meeting ends (activeMeeting becomes null after joining)
    useEffect(() => {
        if (activeMeeting) {
            hasJoinedRef.current = true;
        } else if (hasJoinedRef.current) {
            navigate("/chat", { replace: true });
        }
    }, [activeMeeting, navigate]);

    const handleParticipantAction = (action) => {
        if (action === "personal-chat") {
            setActiveSidebar("personal-chat");
        } else {
            setActiveSidebar(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white relative">
            <div className="bg-gray-800 p-2 text-center text-sm text-gray-400">
                Meeting ID: {meetingId} | {activeMeeting ? "Connected" : "Connecting..."}
            </div>

            <div className="flex-1 overflow-hidden flex relative">
                <VideoGrid />

                {/* Meeting Chat Sidebar */}
                <Chat
                    isOpen={activeSidebar === "meeting-chat"}
                    onClose={() => setActiveSidebar(null)}
                />

                {/* Participant List Sidebar */}
                {activeSidebar === "participants" && (
                    <ParticipantList
                        onClose={handleParticipantAction}
                    />
                )}

                {/* Personal Chat Sidebar */}
                {activeSidebar === "personal-chat" && (
                    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900 border-l border-gray-700 z-50 flex flex-col shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                            <button
                                onClick={() => setActiveSidebar("participants")}
                                className="text-gray-400 hover:text-white flex items-center gap-1"
                            >
                                ← Back
                            </button>
                            <span className="font-semibold">
                                {currentSelectedChat.current?.isGroupChat
                                    ? currentSelectedChat.current.name
                                    : "Personal Chat"}
                            </span>
                            <button onClick={() => setActiveSidebar(null)}>✕</button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {/* ChatsSection is designed to fill height, but we need to ensure it fits */}
                            <ChatsSection />
                        </div>
                    </div>
                )}
            </div>

            <Controls
                onChatToggle={() => setActiveSidebar(activeSidebar === "meeting-chat" ? null : "meeting-chat")}
                onParticipantsToggle={() => setActiveSidebar(activeSidebar === "participants" ? null : "participants")}
            />
        </div>
    );
};

export default MeetingRoom;
