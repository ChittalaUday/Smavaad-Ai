import React from "react";
import { useMeeting } from "../../context/MeetingContext";
import {
    BsMic, BsMicMute,
    BsCameraVideo, BsCameraVideoOff,
    BsTelephoneX,
    BsChatDots, BsPeople
} from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";

const Controls = ({ onChatToggle, onParticipantsToggle }) => {
    const {
        toggleMic, toggleCam,
        isMicOn, isCamOn,
        leaveMeeting,
        shareScreen, stopScreenShare, isScreenSharing
    } = useMeeting();

    const toggleScreenShare = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            shareScreen();
        }
    };

    return (
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4">
            <button
                onClick={toggleMic}
                className={`p-4 rounded-full ${isMicOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                    } text-white transition-colors`}
                title={isMicOn ? "Mute" : "Unmute"}
            >
                {isMicOn ? <BsMic size={24} /> : <BsMicMute size={24} />}
            </button>

            <button
                onClick={toggleCam}
                className={`p-4 rounded-full ${isCamOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                    } text-white transition-colors`}
                title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
            >
                {isCamOn ? <BsCameraVideo size={24} /> : <BsCameraVideoOff size={24} />}
            </button>

            <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full ${isScreenSharing ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"
                    } text-white transition-colors`}
                title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            >
                {isScreenSharing ? <MdStopScreenShare size={24} /> : <MdScreenShare size={24} />}
            </button>

            {onChatToggle && (
                <button
                    onClick={onChatToggle}
                    className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    title="Chat"
                >
                    <BsChatDots size={24} />
                </button>
            )}

            {onParticipantsToggle && (
                <button
                    onClick={onParticipantsToggle}
                    className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    title="Participants"
                >
                    <BsPeople size={24} />
                </button>
            )}

            <button
                onClick={leaveMeeting}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors px-8"
                title="End Call"
            >
                <BsTelephoneX size={24} />
            </button>
        </div>
    );
};

export default Controls;
