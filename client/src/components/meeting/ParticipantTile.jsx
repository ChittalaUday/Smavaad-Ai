import React from "react";
import { FaMicrophoneSlash } from "react-icons/fa";
import Avatar from "react-avatar";
import useActiveSpeaker from "../../hooks/useActiveSpeaker";

const ParticipantTile = ({
    stream,
    username,
    userId,
    isLocal = false,
    isMuted = false,
    isActiveSpeaker: propIsActiveSpeaker = false,
    avatarUrl = null
}) => {
    const videoRef = React.useRef(null);
    const isSpeaking = useActiveSpeaker(stream);

    // Use prop if provided (for manual override), otherwise use detected state
    const isActiveSpeaker = propIsActiveSpeaker || (isSpeaking && !isMuted);


    React.useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div
            className={`
                relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-lg border 
                transition-all duration-300 ease-in-out group
                ${isActiveSpeaker ? "border-green-500 ring-2 ring-green-500/50" : "border-gray-800"}
            `}
        >
            {/* Video Element */}
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal} // Always mute local to prevent feedback
                    className={`w-full h-full object-contain bg-black transition-transform duration-300 ${isLocal ? "scale-x-[-1]" : ""}`}
                />
            ) : (
                /* Avatar Fallback */
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Avatar
                        name={username}
                        src={avatarUrl}
                        size="80"
                        round={true}
                        className="opacity-80"
                    />
                </div>
            )}

            {/* User Label */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 max-w-[80%]">
                <span className="truncate">{username || "User"} {isLocal && "(You)"}</span>
                {isMuted && <FaMicrophoneSlash className="text-red-500 text-xs shrink-0" />}
            </div>

            {/* Speaking Indicator (Visual Pulse) */}
            {isActiveSpeaker && !isMuted && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>
    );
};

export default ParticipantTile;
