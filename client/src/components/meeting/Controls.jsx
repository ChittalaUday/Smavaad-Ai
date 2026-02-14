import React, { useState } from "react";
import { useMeeting } from "../../context/MeetingContext";
import {
    Mic, MicOff,
    Video, VideoOff,
    PhoneOff,
    MessageSquare,
    Users,
    MonitorUp, MonitorOff,
    MoreHorizontal,
    Smile,
    Settings,
    Flag,
    HelpCircle
} from "lucide-react";

/**
 * Reusable Control Button Component
 */
const ControlButton = ({ onClick, isActive, activeIcon: ActiveIcon, inactiveIcon: InactiveIcon = null, label, variant = "default", className = "", badge = null }) => {
    const Icon = (isActive || !InactiveIcon) ? ActiveIcon : InactiveIcon;

    let baseStyles = "p-3.5 rounded-full transition-all duration-300 flex items-center justify-center relative group";
    let variantStyles = "";

    if (variant === "danger") {
        variantStyles = "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30";
    } else if (variant === "mic-cam") {
        variantStyles = isActive
            ? "bg-white/10 hover:bg-white/20 text-white border border-transparent"
            : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20";
    } else if (variant === "primary") {
        variantStyles = isActive
            ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "bg-white/10 hover:bg-white/20 text-white";
    } else {
        // Default toggle
        variantStyles = isActive
            ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5";
    }

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variantStyles} ${className}`}
            title={label}
        >
            <Icon size={20} strokeWidth={2} />

            {/* Notification Badge */}
            {badge && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {badge}
                </span>
            )}

            {/* Tooltip */}
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                {label}
                {/* Arrow */}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80" />
            </span>
        </button>
    );
};

/**
 * Modern floating control bar for active meetings.
 */
const Controls = ({ onChatToggle, onParticipantsToggle, chatBadge, onReaction }) => {
    const {
        toggleMic, toggleCam,
        isMicOn, isCamOn,
        leaveMeeting,
        shareScreen, stopScreenShare, isScreenSharing
    } = useMeeting();

    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showReactions, setShowReactions] = useState(false);

    const toggleScreenShare = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            shareScreen();
        }
    };

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">

            {/* Reactions Popover */}
            {showReactions && (
                <div className="flex gap-2 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl animate-fade-in-up mb-2">
                    {["👍", "❤️", "😂", "😮", "👏", "🎉"].map((emoji) => (
                        <button
                            key={emoji}
                            className="text-2xl hover:scale-150 active:scale-90 transition-transform p-1.5 rounded-xl hover:bg-white/10"
                            onClick={() => {
                                onReaction?.(emoji);
                                setShowReactions(false);
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* More Menu Dropdown */}
            {showMoreMenu && (
                <div className="absolute bottom-full mb-4 right-0 w-56 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up origin-bottom-right p-1">
                    <div className="flex flex-col">
                        <button className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 rounded-xl transition-colors text-left">
                            <Settings size={16} className="text-slate-400" />
                            <span>Settings</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 rounded-xl transition-colors text-left">
                            <Flag size={16} className="text-slate-400" />
                            <span>Report an Issue</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 rounded-xl transition-colors text-left">
                            <HelpCircle size={16} className="text-slate-400" />
                            <span>Help Center</span>
                        </button>
                        <div className="h-px bg-white/10 my-1 mx-2" />
                        <div className="px-4 py-2 text-xs text-slate-500 text-center">
                            Version 1.0.2
                        </div>
                    </div>
                </div>
            )}

            {/* Main Bar */}
            <div className="flex items-center gap-3 p-2.5 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5">

                {/* 1. Audio/Video Controls */}
                <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                    <ControlButton
                        onClick={toggleMic}
                        isActive={isMicOn}
                        activeIcon={Mic}
                        inactiveIcon={MicOff}
                        label={isMicOn ? "Mute" : "Unmute"}
                        variant="mic-cam"
                    />
                    <ControlButton
                        onClick={toggleCam}
                        isActive={isCamOn}
                        activeIcon={Video}
                        inactiveIcon={VideoOff}
                        label={isCamOn ? "Stop Video" : "Start Video"}
                        variant="mic-cam"
                    />
                </div>

                {/* 2. Middle Controls */}
                <div className="flex items-center gap-2 px-1">
                    <ControlButton
                        onClick={toggleScreenShare}
                        isActive={isScreenSharing}
                        activeIcon={MonitorUp}
                        label={isScreenSharing ? "Stop Sharing" : "Share"}
                        variant={isScreenSharing ? "primary" : "default"}
                    />
                    <ControlButton
                        onClick={() => {
                            setShowReactions(!showReactions);
                            setShowMoreMenu(false);
                        }}
                        isActive={showReactions}
                        activeIcon={Smile}
                        label="Reactions"
                    />
                    <ControlButton
                        onClick={() => {
                            setShowMoreMenu(!showMoreMenu);
                            setShowReactions(false);
                        }}
                        isActive={showMoreMenu}
                        activeIcon={MoreHorizontal}
                        label="More"
                    />
                </div>

                {/* 3. Panel Toggles & End Call */}
                <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                    {onChatToggle && (
                        <ControlButton
                            onClick={() => {
                                onChatToggle();
                                setShowMoreMenu(false);
                                setShowReactions(false);
                            }}
                            isActive={true}
                            activeIcon={MessageSquare}
                            label="Chat"
                            badge={chatBadge}
                        />
                    )}
                    {onParticipantsToggle && (
                        <ControlButton
                            onClick={() => {
                                onParticipantsToggle();
                                setShowMoreMenu(false);
                                setShowReactions(false);
                            }}
                            isActive={true}
                            activeIcon={Users}
                            label="Participants"
                        />
                    )}

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    <button
                        onClick={leaveMeeting}
                        className="flex items-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-95 group"
                        title="Leave Meeting"
                    >
                        <PhoneOff size={20} className="group-hover:animate-pulse" />
                        <span className="font-bold text-sm hidden sm:block">End</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Controls;
