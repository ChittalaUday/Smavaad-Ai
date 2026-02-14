import React from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { FaPhone, FaPhoneSlash } from 'react-icons/fa';
import Avatar from "react-avatar";

const IncomingCallNotification = () => {
    const { incomingCall, acceptCall, rejectCall } = useMeeting();

    if (!incomingCall) return null;

    const { meetingId, caller, type } = incomingCall;

    return (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl p-4 w-80 animate-slide-in">
            <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                    <Avatar
                        name={caller?.username || "Unknown"}
                        src={caller?.avatarUrl}
                        size="50"
                        round={true}
                        className="border-2 border-primary"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div>
                    <h3 className="text-white font-semibold text-lg">{caller?.username}</h3>
                    <p className="text-gray-400 text-sm">Incoming {type === 'call' ? 'Video Call' : 'Meeting Invite'}...</p>
                </div>
            </div>

            <div className="flex gap-3 mt-2">
                <button
                    onClick={() => rejectCall(meetingId, caller?._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <FaPhoneSlash /> Reject
                </button>
                <button
                    onClick={() => acceptCall(meetingId)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <FaPhone /> Accept
                </button>
            </div>

            {/* Ringtone logic could go here or in a useEffect */}
            <audio src="/sounds/ringtone.mp3" autoPlay loop className="hidden" />
        </div>
    );
};

export default IncomingCallNotification;
