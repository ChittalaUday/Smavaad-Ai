import React from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { Phone, PhoneOff } from 'lucide-react';
import Avatar from "react-avatar";

const IncomingCallNotification = () => {
    const { incomingCall, acceptCall, rejectCall } = useMeeting();

    if (!incomingCall) return null;

    const { meetingId, caller, type } = incomingCall;

    return (
        <div className="fixed top-6 right-6 z-[10000] animate-slide-in-right">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-5 w-80 overflow-hidden relative">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center gap-4 mb-5 relative z-10">
                    <div className="relative">
                        <Avatar
                            name={caller?.username || "Unknown"}
                            src={caller?.avatarUrl}
                            size="56"
                            round={true}
                            className="border-2 border-indigo-500 shadow-lg shadow-indigo-500/20"
                        />
                        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg leading-tight">{caller?.username}</h3>
                        <p className="text-indigo-300 text-xs font-medium uppercase tracking-wide mt-1">
                            Incoming {type === 'call' ? 'Video Call' : 'Meeting Invite'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={() => rejectCall(meetingId, caller?._id)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium text-sm"
                    >
                        <PhoneOff size={18} /> Reject
                    </button>
                    <button
                        onClick={() => acceptCall(meetingId)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium text-sm"
                    >
                        <Phone size={18} /> Accept
                    </button>
                </div>

                {/* Ringtone logic could go here or in a useEffect */}
                <audio src="/sounds/ringtone.mp3" autoPlay loop className="hidden" />
            </div>
        </div>
    );
};

export default IncomingCallNotification;
