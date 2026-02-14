import React, { useMemo } from "react";
import { useMeeting } from "../../context/MeetingContext";
import ParticipantTile from "./ParticipantTile";

const VideoGrid = () => {
    const {
        localStream,
        participants,
        user,
        isMicOn
    } = useMeeting();

    // Combine local and remote participants into a single array for easier rendering
    const allParticipants = useMemo(() => {
        const list = [];

        // Add local user first
        if (localStream || user) {
            list.push({
                id: "local",
                stream: localStream,
                username: user?.username || "You",
                isLocal: true,
                isMuted: !isMicOn,
                avatarUrl: user?.avatarUrl
                // isActiveSpeaker logic can be added here later
            });
        }

        // Add remote participants
        Object.entries(participants).forEach(([id, p]) => {
            list.push({
                id,
                stream: p.stream,
                username: p.username,
                userId: p.userId,
                isLocal: false,
                isMuted: false, // You might want to sync mute state from backend later
                avatarUrl: p.avatarUrl
            });
        });

        return list;
    }, [localStream, participants, user, isMicOn]);

    const count = allParticipants.length;

    // Dynamic Grid Class Calculation
    const getGridClass = () => {
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-1 md:grid-cols-2";
        if (count <= 4) return "grid-cols-2";
        if (count <= 6) return "grid-cols-2 md:grid-cols-3";
        if (count <= 9) return "grid-cols-3";
        if (count <= 12) return "grid-cols-3 md:grid-cols-4";
        return "grid-cols-4"; // 13+ support can be improved with pagination later
    };

    return (
        <div className="flex-1 p-4 h-full flex items-center justify-center overflow-hidden bg-transparent">
            <div
                className={`
                    grid ${getGridClass()} gap-4 w-full h-full max-h-full transition-all duration-500 ease-in-out
                    ${count <= 2 ? "auto-rows-fr" : "auto-rows-[minmax(0,1fr)]"}
                `}
            >
                {allParticipants.map((participant) => (
                    <div
                        key={participant.id}
                        className={`
                            w-full h-full min-h-0 flex justify-center items-center
                            ${count === 1 ? "max-w-4xl mx-auto" : ""}
                        `}
                    >
                        <ParticipantTile
                            stream={participant.stream}
                            username={participant.username}
                            userId={participant.userId}
                            isLocal={participant.isLocal}
                            isMuted={participant.isMuted}
                            avatarUrl={participant.avatarUrl}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VideoGrid;
