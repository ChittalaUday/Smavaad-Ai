import React from "react";
import { MicOff } from "lucide-react";
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
                relative w-full h-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl 
                transition-all duration-300 ease-in-out group border-2
                ${isActiveSpeaker
                    ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.01] z-10"
                    : "border-transparent hover:border-white/10"
                }
            `}
        >
            {/* Video Element */}
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal} // Always mute local to prevent feedback
                    className={`w-full h-full object-cover bg-black transition-transform duration-300 ${isLocal ? "scale-x-[-1]" : ""}`}
                />
            ) : (
                /* Avatar Fallback */
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                    <div className="relative">
                        <Avatar
                            name={username}
                            src={avatarUrl}
                            size="120"
                            round={true}
                            className={`opacity-100 shadow-2xl transition-all duration-300 ${isActiveSpeaker ? "scale-110" : "grayscale opacity-80"}`}
                        />
                        {/* Circle Pulsing based on speaking */}
                        {isActiveSpeaker && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-20" />
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500 opacity-50" />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* User Label */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 max-w-[calc(100%-40px)] border border-white/5">
                    <span className="truncate">{username || "User"} {isLocal && "(You)"}</span>
                </div>

                {isMuted && (
                    <div className="w-8 h-8 flex items-center justify-center bg-red-500/90 backdrop-blur-md rounded-full text-white shadow-lg border border-red-400/50">
                        <MicOff size={14} />
                    </div>
                )}
            </div>

            {/* Speaking Indicator (Top Right Dot) */}
            {isActiveSpeaker && !isMuted && stream && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-400/50 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150" />
                </div>
            )}

            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
        </div>
    );
};

export default ParticipantTile;
